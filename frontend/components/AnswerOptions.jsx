// components/AnswerOptions.jsx
import { useState } from 'react';

const AnswerOptions = ({ question, onSelectAnswer }) => {
  const [selected, setSelected] = useState(null);

  const handleSelect = (optionIndex) => {
    setSelected(optionIndex);
    onSelectAnswer(optionIndex);
  };

  const options = [question.option_1, question.option_2, question.option_3, question.option_4];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '500px' }}>
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleSelect(index + 1)}
          disabled={selected !== null}
          style={{
            padding: '20px',
            fontSize: '1.2em',
            backgroundColor: selected === (index + 1) ? 'lightblue' : 'white',
            border: '2px solid #ccc',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default AnswerOptions;
