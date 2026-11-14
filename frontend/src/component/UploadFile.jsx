
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./UploadFile.css";

function UploadFile({ onClose, onPostSuccess }) {
    const [file, setFile] = useState(null);
    const [text, setText] = useState("");
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);

    const fileInputRef = useRef(null);

    const token = localStorage.getItem("token");

    // Close modal with Escape key
    useEffect(() => {
        function handleEscape(e) {
            if (e.key === "Escape" && !loading) {
                onClose();
            }
        }

        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [onClose, loading, preview]);

    function handleFileChange(e) {
        const selectedFile = e.target.files[0];

        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setFile(selectedFile || null);

        if (selectedFile && selectedFile.type.startsWith("image/")) {
            setPreview(URL.createObjectURL(selectedFile));
        } else {
            setPreview("");
        }

        setMessage("");
    }

    function removeFile() {
        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setFile(null);
        setPreview("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function handleSubmit(e) {
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
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message || "Post uploaded successfully!"
            );

            setError(false);

            if (onPostSuccess) {
                onPostSuccess();
            }

            setFile(null);
            setText("");
            setPreview("");

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            // Close after successful upload
            setTimeout(() => {
                onClose();
            }, 700);

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
        <div
            className="upload-modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !loading) {
                    onClose();
                }
            }}
        >
            <div
                className="upload-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="upload-modal-title"
            >
                <header className="upload-header">
                    <button
                        type="button"
                        className="upload-back-button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close modal"
                    >
                        ×
                    </button>

                    <div>
                        <h1 id="upload-modal-title">Create post</h1>
                        <p>Share something with your community.</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="upload-form">
                    <div className="upload-user-avatar">U</div>

                    <div className="upload-form-content">
                        <label
                            htmlFor="post-text"
                            className="upload-label"
                        >
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
                                <img
                                    src={preview}
                                    alt="Selected file preview"
                                />

                                <button
                                    type="button"
                                    className="upload-remove-preview"
                                    onClick={removeFile}
                                    aria-label="Remove selected image"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {file && (
                            <div className="upload-file-info">
                                <span>📎</span>

                                <span className="upload-file-name">
                                    {file.name}
                                </span>

                                <button
                                    type="button"
                                    onClick={removeFile}
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
                            >
                                <span>＋</span>
                                <span>Add media</span>
                            </label>

                            <input
                                ref={fileInputRef}
                                id="post-file"
                                className="upload-file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            <button
                                type="submit"
                                className="upload-submit-button"
                                disabled={
                                    loading ||
                                    (!text.trim() && !file)
                                }
                            >
                                {loading ? "Posting..." : "Post"}
                            </button>
                        </div>

                        {message && (
                            <p
                                className={`upload-message ${
                                    error
                                        ? "upload-message-error"
                                        : "upload-message-success"
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
