import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Profile() {
  const token = localStorage.getItem("token");

  let storedUser = null;

  try {
    const rawUser = localStorage.getItem("user");
    storedUser = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    storedUser = null;
  }

  const [user, setUser] = useState(storedUser);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    storedUser?.profile_image_url || ""
  );
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    setMessage("");
    setError("");

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(user?.profile_image_url || "");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      setError("Please select a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setError("The image must be 10 MB or smaller.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a profile picture first.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("profile_image", selectedFile);

      const response = await fetch(
        `${API_URL}/api/profile/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to update profile picture."
        );
      }

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setUser(data.user);
        setPreviewUrl(
          data.user.profile_image_url || ""
        );
      }

      setSelectedFile(null);
      setMessage("Profile picture updated successfully.");

      event.target.reset();
    } catch (uploadError) {
      console.error("Profile picture upload error:", uploadError);
      setError(
        uploadError.message ||
          "Unable to update profile picture."
      );
    } finally {
      setUploading(false);
    }
  }

  const displayImage =
    previewUrl || user?.profile_image_url || "";

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-6 sm:px-8">
            <h1 className="text-2xl font-extrabold text-slate-900">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your profile picture.
            </p>
          </div>

          <div className="px-5 py-7 sm:px-8">
            <div className="flex flex-col items-center">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-green-100 text-3xl font-extrabold text-green-700 ring-4 ring-green-50">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={user?.full_name || "Profile"}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  getInitials(user?.full_name)
                )}
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                {user?.full_name || "User"}
              </h2>

              {user?.email && (
                <p className="mt-1 break-all text-sm text-slate-500">
                  {user.email}
                </p>
              )}
            </div>

            <form
              onSubmit={handleUpload}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="profile-image"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Profile picture
                </label>

                <input
                  id="profile-image"
                  name="profile_image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-green-600 file:px-4 file:py-3 file:font-semibold file:text-white hover:file:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-slate-500">
                  JPG, PNG or WebP. Maximum size: 10 MB.
                </p>
              </div>

              {message && (
                <div
                  role="status"
                  className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
                >
                  {message}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="min-h-12 w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading
                  ? "Uploading..."
                  : "Update Profile Picture"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
