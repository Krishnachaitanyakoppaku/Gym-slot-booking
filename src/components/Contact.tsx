import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/feedbackService';
import { useAuth } from '../contexts/AuthContext';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface Trainer {
  name: string;
  title: string;
  photo: string;
  phone: string;
  email: string;
  specialization: string;
}

const Contact: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from AuthContext
  const [formData, setFormData] = useState<FormData>({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });

  const trainers: Trainer[] = [
    {
      name: 'Rajesh Kumar',
      title: 'Head Trainer & Fitness Expert',
      photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=face',
      phone: '+91 9876543210',
      email: 'rajesh.kumar@iiitdm.ac.in',
      specialization: 'Strength Training, Bodybuilding'
    },
    {
      name: 'Priya Sharma',
      title: 'Yoga & Cardio Instructor',
      photo: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=200&h=200&fit=crop&crop=face',
      phone: '+91 9876543211',
      email: 'priya.sharma@iiitdm.ac.in',
      specialization: 'Yoga, Cardio, Weight Loss'
    },
    {
      name: 'Amit Singh',
      title: 'Sports Physiotherapist',
      photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face',
      phone: '+91 9876543212',
      email: 'amit.singh@iiitdm.ac.in',
      specialization: 'Injury Prevention, Rehabilitation'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to submit feedback.');
      navigate('/'); // Redirect to login page
      return;
    }

    try {
      await feedbackService.submitFeedback(
        user.id,
        formData.name,
        formData.email,
        formData.subject,
        formData.message,
        5 // Default rating since it's removed from UI
      );
      alert('Thank you for your feedback! We will get back to you soon.');
      setFormData({
        name: user?.user_metadata?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
      });
    } catch (error: any) {
      alert(`Failed to submit feedback: ${error.message}`);
    }
  };

  return (
    <div className="contact-background">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Back to Home
          </button>
          <h1>Contact Us</h1>
          <p>Get in touch with our trainers and support team</p>
        </div>

        {trainers.map((trainer, index) => (
          <div key={index} className="trainer-card">
            <img 
              src={trainer.photo} 
              alt={trainer.name} 
              className="trainer-photo"
            />
            <div className="trainer-info">
              <h3 className="trainer-name">{trainer.name}</h3>
              <p className="trainer-title">{trainer.title}</p>
              <p className="trainer-specialization">{trainer.specialization}</p>
              <ul className="contact-details">
                <li className="contact-item">
                  <i className="fas fa-phone contact-icon"></i>
                  <span>{trainer.phone}</span>
                </li>
                <li className="contact-item">
                  <i className="fas fa-envelope contact-icon"></i>
                  <span>{trainer.email}</span>
                </li>
              </ul>
            </div>
          </div>
        ))}

        <div className="feedback-section">
          <h2>Send us your feedback</h2>
          <form className="feedback-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="booking">Booking Issue</option>
                <option value="equipment">Equipment Problem</option>
                <option value="trainer">Trainer Feedback</option>
                <option value="suggestion">Suggestion</option>
              </select>
            </div>
            
            
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Tell us about your experience or ask any questions..."
                required
              ></textarea>
            </div>
            
            <button type="submit" className="submit-btn">
              Send Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;