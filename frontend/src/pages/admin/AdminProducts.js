import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Table, Button, Modal, Form, Alert, Spinner, 
    Row, Col, Container, ListGroup, InputGroup, Pagination 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// 1. IMPORT THUNKS VÀ SELECTORS TỪ SLICE
import {
    fetchAdminProducts,
    fetchAdminCategories,
    fetchAdminProductDetail,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
    resetCurrentProduct, // Action để reset form
    selectAdminProducts,
    selectAdminCategories,
    selectAdminProductsPagination,
    selectAdminProductsStatus,
    selectAdminProductsError,
    selectAdminCurrentProduct // Selector cho data form edit/detail
} from '../../redux/adminProductsSlice'; 

// Import CSS
import "../../styles/pages/AdminProducts.css"; 

// 2. CÁC HÀM HELPER (COPY TỪ FILE "CŨ")

// Định nghĩa baseURL cho ảnh
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Hàm chuẩn hóa tên file (copy từ file 1)
const vietnameseNormalize = (text) => {
  if (!text) return '';
  text = text.toLowerCase();
  text = text.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ''); // Loại ký tự lạ
  return text;
};

// Hàm format tiền (copy từ file 1)
const fmtVND = (n) => {
    if (n === undefined || n === null || isNaN(n)) return '0 VND';
    // Chuyển đổi về số trước khi format
    return Number(n).toLocaleString('vi-VN', { 
        style: 'currency', 
        currency: 'VND', 
        maximumFractionDigits: 0 
    });
};

// 3. COMPONENT CHÍNH
function AdminProducts() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // === A. STATE TỪ REDUX ===
  const products = useSelector(selectAdminProducts);
  const categories = useSelector(selectAdminCategories);
  const pagination = useSelector(selectAdminProductsPagination);
  const status = useSelector(selectAdminProductsStatus); // 'idle', 'loading', 'succeeded', 'failed'
  const error = useSelector(selectAdminProductsError); // Lỗi chung của list
  
  // State cho data của form (detail/edit)
  const currentProductData = useSelector(selectAdminCurrentProduct);
  const { 
      details: detailData, 
      variants: detailVariantsData,
      images: detailImagesData,
      colorImages: detailColorImagesData,
      status: detailStatus // Status của việc load chi tiết
  } = currentProductData;
  
  const loading = (status === 'loading' || detailStatus === 'loading');
  const { totalPages } = pagination; // Lấy totalPages từ pagination

  // === B. STATE LOCAL (CHO FILTER VÀ FORM) ===
  // (Copy từ file "cũ")
  
  // State cho filter
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortPrice, setSortPrice] = useState(null);
  
  // State cho modal
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // State cho FORM (Add/Edit)
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    price: 0,
    discountPercent: 0,
    description: '',
    categoryId: '',
    discountedPrice: 0,
  });
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]); // Ảnh chung
  const [colorImages, setColorImages] = useState({}); // Ảnh theo màu
  const [uniqueColors, setUniqueColors] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [variantErrors, setVariantErrors] = useState([]);

  // === C. EFFECTS (GỌI API QUA REDUX) ===

  // Auto-clear errors/success (giữ nguyên từ file 1, nhưng dùng toast)
  // Lưu ý: Slice đã tự động toast, nên state `errors` và `successMessages` cục bộ không cần thiết nữa.
  // Chúng ta sẽ dựa vào `toast` của slice.
  
  // Tính discountedPrice (copy từ file 1)
  useEffect(() => {
    const price = parseFloat(currentProduct.price) || 0;
    const discountPercent = parseFloat(currentProduct.discountPercent) || 0;
    const discountedPrice = discountPercent > 0 ? price * (1 - discountPercent / 100) : price;
    setCurrentProduct((prev) => ({
      ...prev,
      discountedPrice: discountedPrice, // Giữ là số
    }));
  }, [currentProduct.price, currentProduct.discountPercent]);

  // Update uniqueColors (copy từ file 1)
  useEffect(() => {
    // Chuẩn hóa màu TRƯỚC KHI tạo Set
    const colors = [...new Set(variants.map(v => vietnameseNormalize(v.color.trim())).filter(c => c))];
    
    // Lấy lại tên màu gốc (viết hoa/thường) cho đẹp
    const colorMap = new Map();
    variants.forEach(v => {
        const normColor = vietnameseNormalize(v.color.trim());
        if (normColor && !colorMap.has(normColor)) {
            colorMap.set(normColor, v.color.trim()); // Lưu lại tên gốc
        }
    });

    setUniqueColors(colors.map(normColor => colorMap.get(normColor))); // Hiển thị tên gốc
  }, [variants]);

  // Fetch categories (SỬA: Dùng Redux)
  useEffect(() => {
    dispatch(fetchAdminCategories());
  }, [dispatch]);

  // Fetch products (SỬA: Dùng Redux)
  useEffect(() => {
    dispatch(fetchAdminProducts({ page, limit, keyword, categoryId, sortPrice }));
  }, [dispatch, page, limit, keyword, categoryId, sortPrice]);
  
  // SỬA: Lắng nghe data từ Redux để fill form SỬA
  useEffect(() => {
    // Chỉ chạy khi đang edit, load data thành công, và có data
    if (isEdit && detailStatus === 'succeeded' && detailData) {
        // 1. Fill local form state
        setCurrentProduct({
            name: detailData.Name,
            price: detailData.Price || 0,
            discountPercent: detailData.DiscountPercent || 0,
            discountedPrice: detailData.DiscountedPrice || 0,
            description: detailData.Description || '',
            categoryId: String(detailData.CategoryID || ''),
            ProductID: detailData.ProductID,
        });

        // 2. Fill variants (phải map lại cấu trúc)
        setVariants(
            (detailVariantsData || []).map((v) => ({
                size: v.Size,
                color: v.Color,
                stockQuantity: v.StockQuantity,
                isActive: v.IsActive,
            }))
        );

        // 3. Fill images (ảnh chung)
        setImages(
            (detailImagesData || []).map((img) => img.ImageURL) // Chỉ lưu URL
        );

        // 4. Fill colorImages
        setColorImages(detailColorImagesData || {});

        // 5. Reset lỗi và mở modal
        setFormErrors({});
        setVariantErrors([]);
        setShowModal(true);
    }
  }, [isEdit, detailStatus, detailData, detailVariantsData, detailImagesData, detailColorImagesData]);

  // === D. EVENT HANDLERS (SỬA ĐỂ DÙNG REDUX) ===

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // useEffect sẽ tự động fetch lại
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1); // useEffect sẽ tự động fetch lại
  };

  const handleClearFilters = () => {
    setKeyword('');
    setCategoryId('');
    setSortPrice(null);
    setPage(1); // useEffect sẽ tự động fetch lại
  };

  const handlePageChange = (newPage) => setPage(newPage);

  // SỬA: Xử lý Thêm
  const handleAdd = () => {
    setIsEdit(false);
    dispatch(resetCurrentProduct()); // Reset data edit cũ trong Redux
    
    // Reset local form state (copy từ file 1)
    setCurrentProduct({
      name: '',
      price: 0,
      discountPercent: 0,
      discountedPrice: 0,
      description: '',
      categoryId: '',
    });
    setVariants([]);
    setImages([]);
    setColorImages({});
    setUniqueColors([]);
    setFormErrors({});
    setVariantErrors([]);
    setShowModal(true);
  };

  // SỬA: Xử lý Sửa
  const handleEdit = async (id) => {
    setIsEdit(true);
    dispatch(fetchAdminProductDetail(id));
    // useEffect ở trên sẽ lắng nghe và mở modal khi data về
  };

  // SỬA: Xử lý Xóa
  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa sản phẩm?')) return;
    dispatch(deleteAdminProduct(id));
  };

  // Validate form (copy từ file 1)
  const validateForm = () => {
    const errors = {};
    if (!currentProduct.name || currentProduct.name.length < 3) {
      errors.name = 'Tên sản phẩm phải ít nhất 3 ký tự.';
    }
    if (!currentProduct.price || currentProduct.price <= 0) {
      errors.price = 'Giá phải lớn hơn 0.';
    }
    if (currentProduct.discountPercent < 0 || currentProduct.discountPercent > 100) {
      errors.discountPercent = 'Giảm giá từ 0 đến 100%.';
    }
    if (!currentProduct.categoryId) {
      errors.categoryId = 'Bắt buộc chọn danh mục.';
    }
    if (variants.length === 0) {
      errors.variants = 'Phải có ít nhất một biến thể.';
    }
    return errors;
  };

  // Validate variant (copy từ file 1)
  const validateVariant = (variant, index, allVariants = []) => { // Thêm allVariants
    const errors = {};
    if (!variant.size || isNaN(variant.size) || parseFloat(variant.size) <= 0) {
      errors.size = `Size ở biến thể ${index + 1} phải là số lớn hơn 0.`;
    }
    if (!variant.color || !/^[\p{L}\s]+$/u.test(variant.color)) {
      errors.color = `Màu ở biến thể ${index + 1} phải là chữ (có thể có dấu).`;
    }
    
    // *** FIX LỖI "NHẬP 1 ĐẰNG RA 1 NẺO" ***
    // Điều kiện nghiêm ngặt hơn, check cả chuỗi rỗng và isNaN
    if (variant.stockQuantity === null || variant.stockQuantity === undefined || variant.stockQuantity === '' || isNaN(parseFloat(variant.stockQuantity)) || parseFloat(variant.stockQuantity) < 0) {
        errors.stockQuantity = `Tồn kho ở biến thể ${index + 1} phải là số lớn hơn hoặc bằng 0.`;
    }

    // --- THÊM LOGIC CHECK TRÙNG LẶP ---
    const normColor = vietnameseNormalize(variant.color);
    const normSize = String(variant.size);
    
    const isDuplicate = allVariants.some((v, i) => 
        i !== index && // Phải là một biến thể khác
        vietnameseNormalize(v.color) === normColor && 
        String(v.size) === normSize
    );

    if (isDuplicate && !errors.size) { // Chỉ thêm lỗi nếu chưa có lỗi size
        errors.size = `Biến thể (Size ${variant.size} - Màu ${variant.color}) đã tồn tại.`;
    }
    // --- KẾT THÚC LOGIC CHECK TRÙNG LẶP ---

    return errors;
  };

  // Handle Product Change (copy từ file 1)
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({ ...currentProduct, [name]: value });
    // Bỏ validate realtime để tránh lag, chỉ validate khi submit
  };
  
  // SỬA: Xử lý Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate (copy từ file 1)
    const errors = validateForm();
    
    // *** FIX LỖI "MODAL THÊM KHÔNG CHECK TRÙNG" ***
    // Truyền `variants` vào làm tham số thứ 3
    const varErrors = variants.map((v, index) => validateVariant(v, index, variants));
    
    if (Object.keys(errors).length > 0 || varErrors.some((ve) => Object.keys(ve).length > 0)) {
        setFormErrors(errors);
        setVariantErrors(varErrors);
        return; // Dừng lại nếu có lỗi
    }
    setFormErrors({});
    setVariantErrors([]);

    // Tạo FormData (copy từ file 1)
    const formData = new FormData();
    formData.append('name', currentProduct.name);
    formData.append('price', currentProduct.price);
    formData.append('discountPercent', currentProduct.discountPercent);
    formData.append('description', currentProduct.description);
    formData.append('categoryId', currentProduct.categoryId);

    // Variants JSON (copy từ file 1)
    const variantsJson = variants.map(v => ({
      size: v.size,
      color: v.color,
      stockQuantity: v.stockQuantity,
    }));
    formData.append('variants', JSON.stringify(variantsJson));

    // Existing color images (copy từ file 1)
    const existingColorImagesMap = {};
    Object.entries(colorImages).forEach(([col, img]) => {
      if (typeof img === 'string') {
        existingColorImagesMap[col] = img;
      }
    });
    formData.append('existingColorImages', JSON.stringify(existingColorImagesMap));

    // New color files (copy từ file 1)
    Object.entries(colorImages).forEach(([color, img]) => {
      if (img instanceof File) {
        const normFieldname = `colorImage_${vietnameseNormalize(color)}`;
        formData.append(normFieldname, img);
      }
    });

    // General images (copy từ file 1)
    const existingImagesList = images.filter(i => typeof i === 'string');
    formData.append('existingImages', JSON.stringify(existingImagesList));

    images.forEach((image) => {
      if (image instanceof File) {
        formData.append('images', image);
      }
    });

    // SỬA: Dispatch thunk thay vì gọi axios
    let resultAction;
    if (isEdit) {
      resultAction = await dispatch(updateAdminProduct({ 
          productId: currentProduct.ProductID, 
          formData 
      }));
    } else {
      resultAction = await dispatch(createAdminProduct(formData));
    }

    // Đóng modal và fetch lại data nếu thành công
    if (createAdminProduct.fulfilled.match(resultAction) || updateAdminProduct.fulfilled.match(resultAction)) {
      setShowModal(false);
      // Fetch lại trang hiện tại
      dispatch(fetchAdminProducts({ page, limit, keyword, categoryId, sortPrice }));
    }
    // Lỗi sẽ được slice tự động toast
  };

  // === E. CÁC HÀM XỬ LÝ FORM PHỤ (COPY TỪ FILE 1) ===
const addVariant = () => {
    const newVariant = { size: '', color: '', stockQuantity: 0, isActive: true };
    const newVariants = [...variants, newVariant];

    // Validate TẤT CẢ các biến thể (bao gồm cả cái mới)
    const newVarErrors = newVariants.map((v, index) => 
        validateVariant(v, index, newVariants)
    );

    setVariants(newVariants);
    setVariantErrors(newVarErrors);
  };

 const updateVariant = (index, field, value) => {
    // 1. Cập nhật mảng variants (Code này đã đúng từ lượt trước)
    const newVariants = variants.map((variant, i) => {
        if (i === index) {
            return { ...variant, [field]: value };
        }
        return variant;
    });

    // *** FIX LỖI "MAXIMUM UPDATE DEPTH" ***
    // Validate lại *toàn bộ* mảng lỗi, thay vì chỉ 1 item
    const newVarErrors = newVariants.map((v, i) => validateVariant(v, i, newVariants));
    
    // 3. Set cả hai state mới cùng lúc
    setVariants(newVariants);
    setVariantErrors(newVarErrors);
  };
  
  const handleColorImageChange = (color, e) => {
    const file = e.target.files[0];
    if (file) {
      // (Bỏ qua validate, có thể thêm sau)
      setColorImages(prev => ({ ...prev, [color]: file }));
    }
  };

  const removeColorImage = (color) => {
    setColorImages(prev => ({ ...prev, [color]: null })); // Đánh dấu là null để backend xóa
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
    setVariantErrors(variantErrors.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // (Bỏ qua validate)
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // === F. XỬ LÝ MODAL CHI TIẾT (DÙNG REDUX) ===
  const handleRowClick = async (id) => {
    setIsEdit(false);
    dispatch(fetchAdminProductDetail(id));
    setShowDetailModal(true);
  };
  
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    dispatch(resetCurrentProduct()); // Xóa data chi tiết khỏi Redux
  }

  // === G. JSX RENDER (COPY TỪ FILE 1 VÀ SỬA) ===
  return (
    <Container fluid className="admin-product-container">
      <h2>Quản lý Sản phẩm</h2>
      
      {/* Lỗi và Thành công giờ được xử lý bằng Toast (trong slice). 
        Bạn có thể bỏ Alert hoặc giữ lại `error`
      */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Form Filter (Copy từ file 1) */}
      <Form onSubmit={handleSearch}>
        <Row className="mb-3">
          <Col md={4}>
            <InputGroup>
              <Form.Control
                placeholder="Tìm theo tên sản phẩm hoặc mô tả"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button variant="primary" type="submit">
                Tìm
              </Button>
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select
              value={sortPrice || ''}
              onChange={(e) => { setSortPrice(e.target.value || null); setPage(1); }}
            >
              <option value="">Sắp xếp giá</option>
              <option value="asc">Tăng dần</option>
              <option value="desc">Giảm dần</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.CategoryID} value={c.CategoryID}>
                  {c.Name}
                </option>
              ))}
            </Form.Select>
          </Col>
           <Col md={2} className="text-end">
            <Button variant="outline-secondary" onClick={handleClearFilters}>
              Bỏ lọc
            </Button>
          </Col>
        </Row>
      </Form>
      
      <Button variant="success" onClick={handleAdd} className="mb-3">
        Thêm sản phẩm
      </Button>

      {/* SỬA: Dùng `loading` từ Redux */}
      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : (
        <Table striped hover responsive className="admin-product-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Giảm giá (%)</th>
              <th>Giá sau giảm</th>
              <th>Danh mục</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {/* SỬA: Dùng `products` từ Redux */}
            {products.map((p) => (
              <tr key={p.ProductID} onClick={() => handleRowClick(p.ProductID)} style={{ cursor: 'pointer' }}>
                <td>{p.ProductID}</td>
                <td>{p.Name}</td>
                <td>{fmtVND(p.Price)}</td>
                <td>{p.DiscountPercent || 0}%</td>
                <td>{fmtVND(p.DiscountedPrice)}</td>
                <td>{p.CategoryName}</td>
                <td className="admin-product-actions">
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(p.ProductID);
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.ProductID);
                    }}
                  >
                    Xóa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      
      {/* SỬA: Dùng `totalPages` từ Redux */}
      <div className="d-flex justify-content-center">
        {totalPages > 1 && (
            <Pagination>
                {[...Array(totalPages).keys()].map(num => (
                    <Pagination.Item 
                        key={num + 1} 
                        active={num + 1 === page} 
                        onClick={() => handlePageChange(num + 1)}
                    >
                        {num + 1}
                    </Pagination.Item>
                ))}
            </Pagination>
        )}
      </div>

      {/* === MODAL THÊM/SỬA (COPY TỪ FILE 1) === */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Tên sản phẩm</Form.Label>
              <Form.Control
                name="name"
                value={currentProduct.name}
                onChange={handleProductChange}
                isInvalid={!!formErrors.name}
                required
              />
              <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Giá</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={currentProduct.price}
                onChange={handleProductChange}
                isInvalid={!!formErrors.price}
                min="0"
                step="1"
                required
              />
              <Form.Control.Feedback type="invalid">{formErrors.price}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Giảm giá (%)</Form.Label>
              <Form.Control
                type="number"
                name="discountPercent"
                value={currentProduct.discountPercent}
                onChange={handleProductChange}
                isInvalid={!!formErrors.discountPercent}
                min="0"
                max="100"
                step="1"
                required
              />
              <Form.Control.Feedback type="invalid">{formErrors.discountPercent}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Giá sau giảm</Form.Label>
              <Form.Control
                type="text"
                value={fmtVND(currentProduct.discountedPrice)}
                readOnly
                disabled
                style={{ backgroundColor: '#e9ecef' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={currentProduct.description}
                onChange={handleProductChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Danh mục</Form.Label>
              <Form.Select
                name="categoryId"
                value={currentProduct.categoryId}
                onChange={handleProductChange}
                isInvalid={!!formErrors.categoryId}
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.CategoryID} value={c.CategoryID}>
                      {c.Name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Không có danh mục
                  </option>
                )}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{formErrors.categoryId}</Form.Control.Feedback>
            </Form.Group>

            {/* Phần biến thể (copy từ file 1) */}
            <h5 className="mb-3">Biến thể</h5>
            {formErrors.variants && (
              <Alert variant="danger">{formErrors.variants}</Alert>
            )}
            <ListGroup className="mb-3">
              {variants.map((v, index) => (
                <ListGroup.Item key={index} className="d-flex gap-2 align-items-start flex-column">
                  <div className="d-flex gap-2 w-100">
                    <Form.Group className="flex-fill">
                      <Form.Label>Size</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Size"
                        value={v.size}
                        onChange={(e) => updateVariant(index, 'size', e.target.value)}
                        isInvalid={!!variantErrors[index]?.size}
                        required
                        min="0.1"
                        step="0.1"
                      />
                      <Form.Control.Feedback type="invalid">{variantErrors[index]?.size}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label>Màu</Form.Label>
                      <Form.Control
                        placeholder="Màu"
                        value={v.color}
                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                        isInvalid={!!variantErrors[index]?.color}
                        required
                      />
                      <Form.Control.Feedback type="invalid">{variantErrors[index]?.color}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="flex-fill">
                      <Form.Label>Tồn kho</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Tồn kho"
                        value={v.stockQuantity}
                        onChange={(e) => updateVariant(index, 'stockQuantity', e.target.value)}
                        isInvalid={!!variantErrors[index]?.stockQuantity}
                        min="0"
                        required
                      />
                      <Form.Control.Feedback type="invalid">{variantErrors[index]?.stockQuantity}</Form.Control.Feedback>
                    </Form.Group>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => removeVariant(index)} className="mt-2">
                    Xóa biến thể
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
            <Button variant="secondary" onClick={addVariant} className="mb-3">
              Thêm biến thể
            </Button>

            {/* Phần ảnh theo màu (copy từ file 1) */}
            <h5 className="mb-3">Ảnh theo màu (áp dụng cho tất cả size của màu đó)</h5>
            {uniqueColors.length === 0 && <Alert variant="info">Thêm biến thể để chọn màu.</Alert>}
            <ListGroup className="mb-3">
              {uniqueColors.map((color) => (
                <ListGroup.Item key={color}>
                  <Row className="align-items-center">
                    <Col xs={3}><strong>{color}</strong></Col>
                    <Col xs={6}>
                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleColorImageChange(color, e)}
                        />
                    </Col>
                    <Col xs={3}>
                    {colorImages[color] && (
                        <div className="d-flex align-items-center">
                        <img
                            src={colorImages[color] instanceof File ? URL.createObjectURL(colorImages[color]) : `${baseURL}${colorImages[color]}`}
                            alt={`Preview ${color}`}
                            width="50"
                        />
                        <Button
                            variant="link"
                            size="sm"
                            className="text-danger ms-2"
                            onClick={() => removeColorImage(color)}
                        >
                            Xóa
                        </Button>
                        </div>
                    )}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>

            {/* Phần ảnh chung (copy từ file 1) */}
            <h5 className="mb-3">Ảnh sản phẩm chung</h5>
            <Form.Control type="file" multiple accept="image/*" onChange={handleImageChange} className="mb-3" />
            <ListGroup className="mb-3">
              {images.map((img, index) => (
                <ListGroup.Item key={index} className="d-flex gap-2 align-items-center">
                  <img
                    src={typeof img === 'string' ? `${baseURL}${img}` : URL.createObjectURL(img)}
                    alt="Preview"
                    width="50"
                  />
                  <span>{typeof img === 'string' ? 'Ảnh đã tải lên' : img.name}</span>
                  <Button variant="danger" size="sm" onClick={() => removeImage(index)}>
                    Xóa
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" /> : (isEdit ? 'Cập nhật' : 'Thêm')}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* === MODAL CHI TIẾT (COPY TỪ FILE 1, SỬA DATA SOURCE) === */}
      {/* SỬA: Dùng `detailData` từ Redux thay vì state local */}
      <Modal show={showDetailModal} onHide={handleCloseDetailModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết sản phẩm: {detailData?.Name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailStatus === 'loading' ? (
             <div className="text-center"><Spinner animation="border" /></div>
          ) : detailData ? (
            <>
              <p><strong>Giá:</strong> {fmtVND(detailData.Price)}</p>
              <p><strong>Giảm giá:</strong> {detailData.DiscountPercent || 0}%</p>
              <p><strong>Giá sau giảm:</strong> {fmtVND(detailData.DiscountedPrice)}</p>
              <p><strong>Mô tả:</strong> {detailData.Description}</p>
              <p><strong>Danh mục:</strong> {detailData.CategoryName}</p>
              
              <h5>Biến thể</h5>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Màu</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {detailVariantsData?.map((v) => (
                    <tr key={v.VariantID}>
                      <td>{v.Size}</td>
                      <td>{v.Color}</td>
                      <td>{v.StockQuantity}</td>
                      <td>{v.IsActive ? 'Hoạt động' : 'Không hoạt động'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <h5>Ảnh theo màu</h5>
              <Row>
                {Object.entries(detailColorImagesData || {}).map(([color, url]) => (
                  <Col md={3} key={color} className="mb-2 text-center">
                    <strong>{color}</strong><br />
                    <img src={`${baseURL}${url}`} alt={color} width="100%" className="img-thumbnail" />
                  </Col>
                ))}
              </Row>

              <h5>Ảnh chung</h5>
              <Row>
                {detailImagesData?.map((img) => (
                  <Col md={3} key={img.ImageID} className="mb-2">
                    <img src={`${baseURL}${img.ImageURL}`} alt="Product" width="100%" className="img-thumbnail" />
                    {img.IsDefault && <span className="badge bg-info">Mặc định</span>}
                  </Col>
                ))}
              </Row>
            </>
          ) : (
             <Alert variant="danger">Không thể tải chi tiết sản phẩm.</Alert>
          )}
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default AdminProducts;