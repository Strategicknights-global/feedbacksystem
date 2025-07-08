import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FaTrash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminPanel = () => {
  const [forms, setForms] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [formName, setFormName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFormsAndQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const formsSnapshot = await getDocs(collection(db, 'forms'));
      const formsList = formsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setForms(formsList);

      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const questionsList = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const enhancedQuestions = questionsList.map(q => {
        const form = formsList.find(f => f.id === q.formId);
        return {
          ...q,
          formName: form ? form.name : 'Unknown',
        };
      });
      setQuestions(enhancedQuestions);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load forms and questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (forms.length > 0 && !selectedFormId) {
      setSelectedFormId(forms[0].id);
    }
  }, [forms, selectedFormId]);

  useEffect(() => {
    fetchFormsAndQuestions();
  }, [fetchFormsAndQuestions]);

  const handleAddForm = async () => {
    if (!formName.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'forms'), { name: formName.trim() });
      setFormName('');
      toast.success('Form added successfully!');
      await fetchFormsAndQuestions();
    } catch (err) {
      console.error('Error adding form:', err);
      toast.error('Failed to add form.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !selectedFormId) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'questions'), {
        question: questionText.trim(),
        formId: selectedFormId,
      });
      setQuestionText('');
      toast.success('Question added successfully!');
      await fetchFormsAndQuestions();
    } catch (err) {
      console.error('Error adding question:', err);
      toast.error('Failed to add question.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (id) => {
    if (!window.confirm('Are you sure you want to delete this form? All associated questions will also be deleted.')) return;
    setLoading(true);
    try {
      // Delete all questions related to this form
      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const batch = writeBatch(db);
      questionsSnapshot.docs.forEach(qDoc => {
        if (qDoc.data().formId === id) {
          batch.delete(qDoc.ref);
        }
      });
      batch.delete(doc(db, 'forms', id));
      await batch.commit();

      if (selectedFormId === id) {
        setSelectedFormId('');
      }
      toast.success('Form and its questions deleted successfully!');
      await fetchFormsAndQuestions();
    } catch (err) {
      console.error('Error deleting form:', err);
      toast.error('Failed to delete form.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'questions', id));
      toast.success('Question deleted successfully!');
      await fetchFormsAndQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      toast.error('Failed to delete question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnHover />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">Admin Panel</h1>

        {/* Form Creation */}
        <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="New Form Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading}
          />
          <button
            onClick={handleAddForm}
            disabled={loading || !formName.trim()}
            className={`px-4 py-2 rounded transition ${
              loading || !formName.trim()
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Add Form
          </button>
        </div>

        {/* Question Creation */}
        <div className="mb-10 flex flex-col md:flex-row items-center gap-4">
          <select
            value={selectedFormId}
            onChange={(e) => setSelectedFormId(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading || forms.length === 0}
          >
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="New Question"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={loading || !selectedFormId}
          />
          <button
            onClick={handleAddQuestion}
            disabled={loading || !questionText.trim() || !selectedFormId}
            className={`px-4 py-2 rounded transition ${
              loading || !questionText.trim() || !selectedFormId
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Add Question
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600 text-center">Loading data...</p>
        ) : (
          <div className="space-y-10">
            {/* List Forms */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Forms</h2>
              {forms.length === 0 ? (
                <p className="text-gray-500 italic">No forms available.</p>
              ) : (
                <div className="space-y-3">
                  {forms.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center justify-between border p-4 rounded shadow-sm hover:shadow-md transition"
                    >
                      <span className="text-lg">{form.name}</span>
                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete form"
                        disabled={loading}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List Questions */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Questions</h2>
              {questions.length === 0 ? (
                <p className="text-gray-500 italic">No questions added yet.</p>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between border p-4 rounded shadow-sm hover:shadow-md transition"
                    >
                      <div>
                        <p className="text-lg font-medium">{q.question}</p>
                        <p className="text-sm text-gray-500">
                          Form: <span className="italic">{q.formName}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete question"
                        disabled={loading}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPanel;

