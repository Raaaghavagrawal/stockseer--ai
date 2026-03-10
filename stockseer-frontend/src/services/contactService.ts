import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ContactFormData, ContactSubmissionResponse } from '../types/contact';

class ContactService {
  private readonly collectionName = 'contact_submissions';

  /**
   * Submit a contact form to Firebase
   */
  async submitContactForm(formData: ContactFormData): Promise<ContactSubmissionResponse> {
    try {
      // Validate required fields
      if (!formData.fullName || !formData.email || !formData.message) {
        return {
          success: false,
          message: 'Please fill in all required fields.'
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return {
          success: false,
          message: 'Please enter a valid email address.'
        };
      }

      // Prepare data for Firebase
      const contactData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        subject: formData.subject || 'General Inquiry',
        message: formData.message.trim(),
        newsletter: formData.newsletter || false,
        status: 'new' as const,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        source: 'landing_page'
      };

      // Add document to Firebase
      const docRef = await addDoc(collection(db, this.collectionName), contactData);

      console.log('Contact form submitted successfully:', docRef.id);

      return {
        success: true,
        message: 'Thank you for your message! We\'ll get back to you soon.',
        id: docRef.id
      };

    } catch (error) {
      console.error('Error submitting contact form:', error);
      
      return {
        success: false,
        message: 'Sorry, there was an error submitting your message. Please try again later.'
      };
    }
  }

  /**
   * Get contact form statistics (for admin use)
   */
  async getContactStats(): Promise<{ total: number; new: number; read: number; replied: number }> {
    try {
      // This would typically be implemented with proper Firebase queries
      // For now, returning mock data
      return {
        total: 0,
        new: 0,
        read: 0,
        replied: 0
      };
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      return {
        total: 0,
        new: 0,
        read: 0,
        replied: 0
      };
    }
  }
}

// Export singleton instance
export const contactService = new ContactService();
export default contactService;
