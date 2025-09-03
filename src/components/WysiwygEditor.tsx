
import { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// const quillTable = require('quill-table');
import Table from 'quill-table';
// import 'quill-table/dist/quill.table.css';
interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const WysiwygEditor = ({ value, onChange, placeholder }: WysiwygEditorProps) => {
  const [internalValue, setInternalValue] = useState(value);
  const quillRef = useRef<ReactQuill>(null);

  // Sync external value changes with internal state
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (content: string) => {
    setInternalValue(content);
    onChange(content);
  };
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike',],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'code-block','align',
    'link', 'image'
  ];

  return (
    <div className="bg-white">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={internalValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="min-h-[200px]"
      />
    </div>
  );
};

export default WysiwygEditor;
