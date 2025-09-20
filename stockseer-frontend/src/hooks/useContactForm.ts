import { useState } from 'react';
import { contactService } from '../services/contactService';
import type { ContactSubmissionResponse } from '../types/contact';

export interface ContactFormState {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  newsletter: boolean;
}

export interface ContactFormErrors {
  fullName?: string;
  email?: string;
  subject?: string;
  message?: string;
  newsletter?: string;
  general?: string;
}

export const useContactForm = () => {
  const [formData, setFormData] = useState<ContactFormState>({
    fullName: '',
    email: '',
    subject: '',
    message: '',
    newsletter: false
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResponse, setSubmitResponse] = useState<ContactSubmissionResponse | null>(null);

  const updateField = (field: keyof ContactFormState, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};

    // Required field validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    if (formData.subject && formData.subject.length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitForm = async (): Promise<ContactSubmissionResponse> => {
    if (!validateForm()) {
      return {
        success: false,
        message: 'Please fix the errors above before submitting.'
      };
    }

    setIsSubmitting(true);
    setSubmitResponse(null);

    try {
      const response = await contactService.submitContactForm(formData);
      setSubmitResponse(response);
      
      if (response.success) {
        // Reset form on successful submission
        setFormData({
          fullName: '',
          email: '',
          subject: '',
          message: '',
          newsletter: false
        });
        setErrors({});
      }
      
      return response;
    } catch (error) {
      const errorResponse = {
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      };
      setSubmitResponse(errorResponse);
      return errorResponse;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      subject: '',
      message: '',
      newsletter: false
    });
    setErrors({});
    setSubmitResponse(null);
  };

  const clearResponse = () => {
    setSubmitResponse(null);
  };

  return {
    formData,
    errors,
    isSubmitting,
    submitResponse,
    updateField,
    validateForm,
    submitForm,
    resetForm,
    clearResponse
  };
};
