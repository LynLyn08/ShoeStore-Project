import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup, Ratio } from 'react-bootstrap';
import { FiUser, FiMail, FiPhone, FiMessageCircle, FiSend, FiMapPin, FiClock, FiPhoneCall, FiFacebook, FiInstagram } from 'react-icons/fi';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { sendContactForm, selectContactStatus, selectContactError, resetContactStatus } from '../../redux/contactSlice';

const gold = '#d4af37';

export default function Contact() {
    const dispatch = useDispatch();
    const contactStatus = useSelector(selectContactStatus);
    const contactError = useSelector(selectContactError);

    // Dọn dẹp trạng thái khi component unmount
    useEffect(() => {
        return () => {
            dispatch(resetContactStatus());
        };
    }, [dispatch]);

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: '',
        },
        validationSchema: Yup.object({
            name: Yup.string().required('Vui lòng nhập họ và tên.'),
            email: Yup.string().email('Email không hợp lệ.').required('Vui lòng nhập email.'),
            phone: Yup.string().matches(/(^$)|(^[0-9+\s()-]{8,}$)/, 'Số điện thoại không hợp lệ.').optional(),
            subject: Yup.string().required('Vui lòng chọn chủ đề.'),
            message: Yup.string().required('Vui lòng nhập nội dung.'),
        }),
        onSubmit: async (values, { resetForm }) => {
            const resultAction = await dispatch(sendContactForm(values));
            if (sendContactForm.fulfilled.match(resultAction)) {
                toast.success('Cảm ơn bạn! Chúng tôi đã nhận được thông tin và sẽ phản hồi sớm nhất.');
                resetForm();
            }
        },
    });
    
    return (
        <div style={{ background: 'linear-gradient(135deg,#f8f6ef 0%,#ffffff 50%)' }}>
            <section className="py-5" style={{borderBottom:'1px solid #eee'}}>
                <Container>
                    <h1 className="fw-bold mb-1">Liên hệ Lily Shoes</h1>
                    <p className="text-muted mb-0">Rất hân hạnh được lắng nghe bạn — đội CSKH phản hồi trong vòng <strong>24h</strong>.</p>
                </Container>
            </section>

            <Container className="py-5">
                <Row className="g-4">
                    <Col lg={7}>
                        <Card className="border-0 shadow-lg" style={{ borderTop: `5px solid ${gold}`, borderRadius: 14 }}>
                            <Card.Body className="p-4 p-md-5">
                                {contactStatus === 'failed' && <Alert variant="danger">{contactError}</Alert>}
                                <Form noValidate onSubmit={formik.handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold"><FiUser className="me-2" />Họ và tên *</Form.Label>
                                        <Form.Control name="name" {...formik.getFieldProps('name')} isInvalid={formik.touched.name && formik.errors.name} />
                                        <Form.Control.Feedback type="invalid">{formik.errors.name}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold"><FiMail className="me-2" />Email *</Form.Label>
                                        <Form.Control name="email" type="email" {...formik.getFieldProps('email')} isInvalid={formik.touched.email && formik.errors.email} />
                                        <Form.Control.Feedback type="invalid">{formik.errors.email}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Row>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-semibold"><FiPhone className="me-2" />Điện thoại</Form.Label><Form.Control name="phone" {...formik.getFieldProps('phone')} isInvalid={formik.touched.phone && formik.errors.phone} /></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-semibold">Chủ đề *</Form.Label><Form.Select name="subject" {...formik.getFieldProps('subject')} isInvalid={formik.touched.subject && formik.errors.subject}><option value="" disabled>Chọn chủ đề</option><option>Hỏi về sản phẩm</option><option>Đổi trả – bảo hành</option><option>Hợp tác / B2B</option><option>Góp ý dịch vụ</option></Form.Select></Form.Group></Col>
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold"><FiMessageCircle className="me-2" />Nội dung *</Form.Label>
                                        <Form.Control as="textarea" rows={5} name="message" {...formik.getFieldProps('message')} isInvalid={formik.touched.message && formik.errors.message} />
                                        <Form.Control.Feedback type="invalid">{formik.errors.message}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Button type="submit" className="px-4 py-2 fw-bold" style={{ background: gold, borderColor: gold, color:'#111' }} disabled={contactStatus === 'loading'}>
                                        {contactStatus === 'loading' ? <Spinner size="sm" /> : <><FiSend className="me-2" /> Gửi liên hệ</>}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        <Card className="border-0 shadow-lg mb-4">
                            <Card.Body className="p-4 p-md-5">
                                <h5 className="fw-bold mb-3">Thông tin liên hệ</h5>
                                <ListGroup variant="flush">
                                    <ListGroup.Item className="px-0 d-flex"><FiMapPin className="me-3 mt-1" color={gold} /><div><div className="fw-semibold">Showroom</div><div className="text-muted">123 Trần Phú, Hà Nội</div></div></ListGroup.Item>
                                    <ListGroup.Item className="px-0 d-flex"><FiPhoneCall className="me-3" color={gold} /><a href="tel:0987654321">0987 654 321</a></ListGroup.Item>
                                    <ListGroup.Item className="px-0 d-flex"><FiMail className="me-3" color={gold} /><a href="mailto:support@lilyshoe.vn">support@lilyshoe.vn</a></ListGroup.Item>
                                    <ListGroup.Item className="px-0 d-flex"><FiClock className="me-3 mt-1" color={gold} /><div><div className="fw-semibold">Giờ mở cửa</div><div className="text-muted">Thứ 2–CN: 9:00 – 21:00</div></div></ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                        </Card>
                        <Card className="border-0 shadow-lg">
                            <Card.Body className="p-2">
                                <Ratio aspectRatio="16x9"><iframe title="Bản đồ" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096968039366!2d105.7801083153495!3d21.02882599282305!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab88f7c32769%3A0x1c2153396a5b6f3b!2sKeangnam%20Hanoi%20Landmark%20Tower!5e0!3m2!1sen!2svn!4v1626252000000!5m2!1sen!2svn" style={{ border: 0, borderRadius: 12 }} allowFullScreen loading="lazy"></iframe></Ratio>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}