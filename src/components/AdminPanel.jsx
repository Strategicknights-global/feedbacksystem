import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FaTrash } from 'react-icons/fa';

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
        ...doc.data()
      }));
      setForms(formsList);

      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const questionsList = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const enhancedQuestions = questionsList.map(q => {
        const form = formsList.find(f => f.id === q.formId);
        return {
          ...q,
          formName: form ? form.name : 'Unknown'
        };
      });

      setQuestions(enhancedQuestions);

      if (!selectedFormId && formsList.length > 0) {
        setSelectedFormId(formsList[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFormId]);

  useEffect(() => {
    fetchFormsAndQuestions();
  }, [fetchFormsAndQuestions]);

  const handleAddForm = async () => {
    if (!formName.trim()) return;
    try {
      await addDoc(collection(db, 'forms'), { name: formName });
      setFormName('');
      fetchFormsAndQuestions();
    } catch (err) {
      console.error('Error adding form:', err);
    }
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !selectedFormId) return;
    try {
      await addDoc(collection(db, 'questions'), {
        question: questionText,
        formId: selectedFormId
      });
      setQuestionText('');
      fetchFormsAndQuestions();
    } catch (err) {
      console.error('Error adding question:', err);
    }
  };

  const handleDeleteForm = async (id) => {
    try {
      await deleteDoc(doc(db, 'forms', id));
      fetchFormsAndQuestions();
    } catch (err) {
      console.error('Error deleting form:', err);
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await deleteDoc(doc(db, 'questions', id));
      fetchFormsAndQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  return (
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
        />
        <button
          onClick={handleAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
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
        >
          {forms.map(form => (
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
        />
        <button
          onClick={handleAddQuestion}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
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
                {forms.map(form => (
                  <div key={form.id} className="flex items-center justify-between border p-4 rounded shadow-sm hover:shadow-md transition">
                    <span className="text-lg">{form.name}</span>
                    <button
                      onClick={() => handleDeleteForm(form.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete form"
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
                {questions.map(q => (
                  <div key={q.id} className="flex items-center justify-between border p-4 rounded shadow-sm hover:shadow-md transition">
                    <div>
                      <p className="text-lg font-medium">{q.question}</p>
                      <p className="text-sm text-gray-500">Form: <span className="italic">{q.formName}</span></p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete question"
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
  );
};

export default AdminPanel;
