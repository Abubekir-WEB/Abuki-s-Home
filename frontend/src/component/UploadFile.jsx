
import { useState } from "react";
import axios from "axios";
import "./UploadFile.css";

function UploadFile() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const token = localStorage.getItem("token");

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile || null);
    setPreview(
      selectedFile && selectedFile.type.startsWith("image/")
        ? URL.createObjectURL(selectedFile)
        : ""
    );
    setMessage("");
  }

  async function handlesubmit(e) {
    e.preventDefault();
    setMessage("");
    setError(false);

    if (!text.trim() && !file) {
      setMessage("Please write something or select a file.");
      setError(true);
      return;
    }

    if (!token) {
      setMessage("Please log in before creating a post.");
      setError(true);
      return;
    }

    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    formData.append("text", text);

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:4000/user/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message || "Post uploaded successfully!");
      setError(false);
      setFile(null);
      setText("");
      setPreview("");

      // Reset the file input.
      e.target.reset();
    } catch (err) {
      console.error("Upload error:", err);

      setMessage(
        err.response?.data?.message ||
          "Failed to upload your post. Please try again."
      );
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upload-page">
      <div className="upload-card">
        <header className="upload-header">
          <button
            type="button"
            className="upload-back-button"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            ←
          </button>

          <div>
            <h1>Create post</h1>
            <p>Share something with your community.</p>
          </div>
        </header>

        <form onSubmit={handlesubmit} className="upload-form">
          <div className="upload-user-avatar">U</div>

          <div className="upload-form-content">
            <label htmlFor="post-text" className="upload-label">
              What is happening?
            </label>

            <textarea
              id="post-text"
              className="upload-textarea"
              placeholder="Write your thoughts..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setMessage("");
              }}
              rows={5}
              maxLength={1000}
            />

            <div className="upload-character-count">
              {text.length}/1000
            </div>

            {preview && (
              <div className="upload-preview">
                <img src={preview} alt="Selected file preview" />

                <button
                  type="button"
                  className="upload-remove-preview"
                  onClick={() => {
                    URL.revokeObjectURL(preview);
                    setPreview("");
                    setFile(null);
                  }}
                  aria-label="Remove selected image"
                >
                  ×
                </button>
              </div>
            )}

            {file && (
              <div className="upload-file-info">
                <span>📎</span>
                <span className="upload-file-name">{file.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview("");
                    setFile(null);
                  }}
                  className="upload-clear-file"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="upload-actions">
              <label
                htmlFor="post-file"
                className="upload-file-button"
                title="Choose a file"
              >
                <span>＋</span>
                <span>Add media</span>
              </label>

              <input
                id="post-file"
                className="upload-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />

              <button
                type="submit"
                className="upload-submit-button"
                disabled={loading || (!text.trim() && !file)}
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>

            {message && (
              <p
                className={`upload-message ${
                  error ? "upload-message-error" : "upload-message-success"
                }`}
                role="status"
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadFile;
