import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ContactFormData } from '../types/contact';
import { Mail, Eye, Reply, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ContactSubmission extends ContactFormData {
  id: string;
  timestamp: any;
  createdAt: string;
  userAgent: string;
  source: string;
}

const ContactAdmin: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'closed'>('all');

  useEffect(() => {
    const q = query(collection(db, 'contact_submissions'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContactSubmission[];
      
      setSubmissions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, status: 'new' | 'read' | 'replied' | 'closed') => {
    try {
      if (!id) {
        console.error('No ID provided for update');
        return;
      }
      await updateDoc(doc(db, 'contact_submissions', id), { status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'read':
        return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'replied':
        return <Reply className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'read':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'replied':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
  };

  const filteredSubmissions = submissions.filter(submission => 
    filter === 'all' || submission.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-binance-yellow"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Contact Submissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and respond to contact form submissions
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { key: 'all', label: 'All', count: submissions.length },
          { key: 'new', label: 'New', count: submissions.filter(s => s.status === 'new').length },
          { key: 'read', label: 'Read', count: submissions.filter(s => s.status === 'read').length },
          { key: 'replied', label: 'Replied', count: submissions.filter(s => s.status === 'replied').length },
          { key: 'closed', label: 'Closed', count: submissions.filter(s => s.status === 'closed').length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Submissions ({filteredSubmissions.length})
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedSubmission?.id === submission.id ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {submission.fullName}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status || 'new')}`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(submission.status || 'new')}
                        <span className="capitalize">{submission.status || 'new'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {submission.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submission Details */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedSubmission.fullName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedSubmission.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {new Date(selectedSubmission.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSubmission.status || 'new')}`}>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedSubmission.status || 'new')}
                      <span className="capitalize">{selectedSubmission.status || 'new'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSubmission.subject || 'General Inquiry'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Message
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedSubmission.message}
                      </p>
                    </div>
                  </div>

                  {selectedSubmission.newsletter && (
                    <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Subscribed to newsletter</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {selectedSubmission.status === 'new' && selectedSubmission.id && (
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'read')}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Mark as Read</span>
                    </button>
                  )}
                  
                  {selectedSubmission.status !== 'replied' && selectedSubmission.id && (
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'replied')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Mark as Replied</span>
                    </button>
                  )}
                  
                  {selectedSubmission.status !== 'closed' && selectedSubmission.id && (
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'closed')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Close</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a submission
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a contact submission from the list to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactAdmin;
