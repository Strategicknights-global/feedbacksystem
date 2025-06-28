import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import RatingIcon from './RatingIcon'; // <-- IMPORT THE EMOJI COMPONENT

const SUBJECTS = ["Subject 1", "Subject 2", "Subject 3", "Subject 4", "Subject 5"];

const UnifiedFeedbackForm = () => {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch all available feedback forms
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const formsSnapshot = await getDocs(collection(db, 'forms'));
        const formsList = formsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setForms(formsList);
      } catch (error) {
        console.error("Error fetching forms: ", error);
      }
    };
    fetchForms();
  }, []);
  
  // Fetch questions when a form is selected
  const fetchQuestions = useCallback(async () => {
    if (!selectedFormId) {
        setQuestions([]);
        return;
    };
    setLoading(true);
    setMessage('');
    try {
        const q = query(collection(db, 'questions'), where('formId', '==', selectedFormId));
        const questionsSnapshot = await getDocs(q);
        const questionsList = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuestions(questionsList);
        setRatings({});
    } catch (error) {
        console.error("Error fetching questions: ", error);
    }
    setLoading(false);
  }, [selectedFormId]);

  useEffect(() => {
    fetchQuestions();
  }, [selectedFormId, fetchQuestions]);

  const handleRatingChange = (questionId, subject, value) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [subject]: parseInt(value)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation logic...
    for (const q of questions) {
        for (const s of SUBJECTS) {
            if (!ratings[q.id] || !ratings[q.id][s]) {
                alert("Please complete all feedback ratings before submitting.");
                return;
            }
        }
    }

    setLoading(true);
    setMessage('');
    try {
      await addDoc(collection(db, 'feedback'), {
        formId: selectedFormId,
        formName: forms.find(f => f.id === selectedFormId)?.name,
        userId: auth.currentUser.uid,
        ratings: ratings,
        submittedAt: serverTimestamp()
      });
      setMessage('Thank you! Your feedback has been submitted successfully.');
      setRatings({});
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      setMessage('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="feedback-form-container">
      <h1 className="page-title" style={{marginBottom: '0.5rem'}}>Syllabus Feedback Form</h1>
      <p className="page-subtitle">Your anonymous feedback is valuable for improving our curriculum.</p>

      <div className="form-selector-container">
        <label htmlFor="form-selection" className="form-selector-label">Select Feedback Form</label>
        <select 
          id="form-selection"
          className="form-select" 
          value={selectedFormId} 
          onChange={e => setSelectedFormId(e.target.value)}
        >
          <option value="">-- Select a form --</option>
          {forms.map(form => (
            <option key={form.id} value={form.id}>{form.name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="loading-spinner"></div>}

      { !loading && selectedFormId && questions.length > 0 && (
        <form onSubmit={handleSubmit} className="card">
          <div className="feedback-grid-container">
            <table className="feedback-grid">
              <thead>
                <tr>
                  <th className="question-col" rowSpan="2">Question</th>
                  {SUBJECTS.map(subject => (
                    <th key={subject} className="subject-header" colSpan="5">{subject}</th>
                  ))}
                </tr>
                <tr>
                  {SUBJECTS.map(subject => (
                    <React.Fragment key={`${subject}-ratings`}>
                      <th className="rating-header">5</th>
                      <th className="rating-header">4</th>
                      <th className="rating-header">3</th>
                      <th className="rating-header">2</th>
                      <th className="rating-header">1</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questions.map((question, qIndex) => (
                  <tr key={question.id}>
                    <td className="question-col">
                      {qIndex + 1}. {question.text} <span className="required-asterisk">*</span>
                    </td>
                    {SUBJECTS.map(subject => (
                      <td key={`${question.id}-${subject}`} className="ratings-cell" colSpan="5">
                        <div className="ratings-group">
                          {[5, 4, 3, 2, 1].map(value => (
                            // <-- USE THE RATINGICON COMPONENT HERE
                            <RatingIcon
                                key={value}
                                value={value}
                                name={`${question.id}-${subject}`}
                                selectedValue={ratings[question.id]?.[subject]}
                                onChange={(e) => handleRatingChange(question.id, subject, e.target.value)}
                            />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {message && <p className={`form-message ${message.includes('error') ? 'error' : 'success'}`}>{message}</p>}
          <div className="feedback-submit-container">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UnifiedFeedbackForm;