import React, { useState } from "react";
import { Send, MessageSquare, CheckCircle } from "lucide-react";
import { contactService } from "../services/api";
import toast from "react-hot-toast";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await contactService.sendMessage(formData);
      setIsSubmitted(true);
      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have a question, feedback, or need assistance? We'd love to hear from you.
            Our team is here to help!
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Contact Form */}
          <div>
            <div className="bg-dark-700/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              {isSubmitted ? (
                /* Success State */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Message Sent Successfully!
                  </h2>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Thank you for reaching out. We've received your message and will get back to you as soon as possible.
                  </p>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                /* Form */
                <>
                  <div className="flex items-center space-x-3 mb-6">
                    <MessageSquare className="w-6 h-6 text-primary-500" />
                    <h2 className="text-2xl font-bold text-white">Send us a Message</h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 bg-dark-600 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Your Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 bg-dark-600 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Subject *
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-dark-600 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        disabled={isSubmitting}
                      >
                        <option value="" className="bg-dark-700">Select a subject</option>
                        <option value="General Inquiry" className="bg-dark-700">General Inquiry</option>
                        <option value="Technical Support" className="bg-dark-700">Technical Support</option>
                        <option value="Billing Question" className="bg-dark-700">Billing Question</option>
                        <option value="Feature Request" className="bg-dark-700">Feature Request</option>
                        <option value="Partnership" className="bg-dark-700">Partnership</option>
                        <option value="Bug Report" className="bg-dark-700">Bug Report</option>
                        <option value="Other" className="bg-dark-700">Other</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help you..."
                        rows={6}
                        className="w-full px-4 py-3 bg-dark-600 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.name || !formData.email || !formData.subject || !formData.message}
                      className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-dark-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-white font-semibold mb-2">How do I create an account?</h3>
              <p className="text-gray-400 text-sm">
                Simply click the "Sign Up" button in the top right corner and follow the registration process. It only takes a few minutes!
              </p>
            </div>
            <div className="bg-dark-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-white font-semibold mb-2">How do I upgrade to VIP?</h3>
              <p className="text-gray-400 text-sm">
                Go to your profile settings and click on "Upgrade Plan". Choose a plan that suits your needs and complete the payment.
              </p>
            </div>
            <div className="bg-dark-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-white font-semibold mb-2">How can I report inappropriate content?</h3>
              <p className="text-gray-400 text-sm">
                Click on the three dots menu on any content or profile and select "Report". Our moderation team will review it promptly.
              </p>
            </div>
            <div className="bg-dark-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-white font-semibold mb-2">How do I withdraw my earnings?</h3>
              <p className="text-gray-400 text-sm">
                Visit your Analytics Dashboard and click on "Withdraw". You can transfer your coins to your linked payment method.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
