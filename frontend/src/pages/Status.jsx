import React, { useEffect, useRef, useState } from "react";
import ChatTabs from "../components/chat/ChatTabs";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://propertynesthomes.onrender.com";

const API_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

function getUserName(user) {
  if (!user) return "User";

  if (user.full_name) {
    return user.full_name;
  }

  const name =
    `${user.first_name || ""} ${user.last_name || ""}`.trim();

  return name || user.email || "User";
}

function timeAgo(date) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  return "1d";
}

export default function Status() {
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showComposer, setShowComposer] =
    useState(false);

  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] =
    useState("");

  const [posting, setPosting] = useState(false);

  const [viewer, setViewer] = useState(null);
  const [viewerIndex, setViewerIndex] =
    useState(0);

  const fileInputRef = useRef(null);

  const loadStatuses = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load statuses"
        );
      }

      setGroups(data.statuses || []);
    } catch (error) {
      console.error(
        "Status loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const openComposer = () => {
    setCaption("");
    setMediaFile(null);
    setMediaPreview("");
    setShowComposer(true);
  };

  const closeComposer = () => {
    if (posting) return;

    setShowComposer(false);
    setCaption("");
    setMediaFile(null);

    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaPreview("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const isImage =
      file.type.startsWith("image/");

    const isVideo =
      file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert(
        "Please select an image or video."
      );
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      alert(
        "Status media must be 30MB or smaller."
      );
      return;
    }

    setMediaFile(file);

    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaPreview(
      URL.createObjectURL(file)
    );
  };

  /*
   * Current backend status endpoint accepts
   * media_url directly. For the first version,
   * text status works immediately.
   *
   * Media upload will be wired into the
   * existing chat media infrastructure next.
   */
  const createTextStatus = async () => {
    if (!caption.trim()) {
      alert("Write something for your status.");
      return;
    }

    try {
      setPosting(true);

      const response = await fetch(
        `${API_URL}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            caption: caption.trim(),
            media_type: "text",
            media_url: null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to post status"
        );
      }

      closeComposer();
      await loadStatuses();
    } catch (error) {
      console.error(
        "Create status error:",
        error
      );

      alert(
        error.message ||
          "Failed to post status."
      );
    } finally {
      setPosting(false);
    }
  };

  const createMediaStatus = async () => {
    if (!mediaFile) return;

    try {
      setPosting(true);

      /*
       * Step 1:
       * Upload the image/video to Cloudinary.
       */
      const formData = new FormData();
      formData.append("file", mediaFile);

      const uploadResponse = await fetch(
        `${API_URL}/status/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const uploadData =
        await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.error ||
            "Failed to upload status media"
        );
      }

      const media =
        uploadData.media;

      /*
       * Step 2:
       * Create the actual status using
       * the Cloudinary URL.
       */
      const statusResponse = await fetch(
        `${API_URL}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            caption: caption.trim(),
            media_url: media.media_url,
            media_type: media.media_type,
          }),
        }
      );

      const statusData =
        await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(
          statusData.error ||
            "Failed to create status"
        );
      }

      closeComposer();
      await loadStatuses();
    } catch (error) {
      console.error(
        "Create media status error:",
        error
      );

      alert(
        error.message ||
          "Failed to post status."
      );
    } finally {
      setPosting(false);
    }
  };

  const postStatus = async () => {
    if (mediaFile) {
      await createMediaStatus();
      return;
    }

    await createTextStatus();
  };

  const markViewed = async (statusId) => {
    try {
      await fetch(
        `${API_URL}/status/${statusId}/view`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error(
        "Status view error:",
        error
      );
    }
  };

  const openStatus = async (
    group,
    index = 0
  ) => {
    const status = group.statuses[index];

    if (!status) return;

    setViewer({
      ...group,
    });

    setViewerIndex(index);

    if (
      !status.viewed &&
      Number(group.user?.id) !== Number(currentUser?.id)
    ) {
      await markViewed(status.id);

      setGroups((previous) =>
        previous.map((item) => {
          if (
            item.user.id !==
            group.user.id
          ) {
            return item;
          }

          const statuses =
            item.statuses.map((s) =>
              s.id === status.id
                ? {
                    ...s,
                    viewed: true,
                  }
                : s
            );

          return {
            ...item,
            statuses,
            has_unviewed:
              statuses.some(
                (s) => !s.viewed
              ),
          };
        })
      );
    }
  };

  const nextStatus = async () => {
    if (!viewer) return;

    if (
      viewerIndex <
      viewer.statuses.length - 1
    ) {
      const nextIndex =
        viewerIndex + 1;

      setViewerIndex(nextIndex);

      const status =
        viewer.statuses[nextIndex];

      if (!status.viewed) {
        await markViewed(status.id);
      }

      return;
    }

    closeViewer();
  };

  const previousStatus = () => {
    if (!viewer) return;

    if (viewerIndex > 0) {
      setViewerIndex(
        viewerIndex - 1
      );
    }
  };

  const closeViewer = () => {
    setViewer(null);
    setViewerIndex(0);
    loadStatuses();
  };

  const viewerStatus =
    viewer?.statuses?.[viewerIndex];

  return (
    <div className="min-h-screen bg-slate-50">
      <ChatTabs />

      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Status
            </h1>

            <p className="text-sm text-slate-500">
              Share updates that disappear
              after 24 hours.
            </p>
          </div>

          <button
            onClick={openComposer}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            + My Status
          </button>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading statuses...
            </div>
          ) : groups.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
                +
              </div>

              <h2 className="font-semibold text-slate-800">
                No statuses yet
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Be the first to share an
                update.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => {
                const user =
                  group.user;

                const displayName =
                  user.full_name ||
                  `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                  user.email ||
                  "User";

                const initials =
                  displayName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("") || "?";

                return (
                  <button
                    key={user.id}
                    onClick={() =>
                      openStatus(
                        group,
                        0
                      )
                    }
                    className="flex w-full items-center gap-4 rounded-xl p-3 text-left hover:bg-slate-50"
                  >
                    <div
                      className={`rounded-full p-[3px] ${
                        group.has_unviewed
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      }`}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600">
                        {initials.toUpperCase()}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900">
                        {getUserName(
                          user
                        )}
                      </div>

                      <div className="text-sm text-slate-500">
                        {group.statuses.length}{" "}
                        {group.statuses.length ===
                        1
                          ? "update"
                          : "updates"}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      {timeAgo(
                        group.statuses[
                          group.statuses
                            .length - 1
                        ].created_at
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Create Status
              </h2>

              <button
                onClick={closeComposer}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600"
              >
                ✕
              </button>
            </div>

            {mediaPreview ? (
              <div className="mb-4 overflow-hidden rounded-2xl bg-black">
                {mediaFile?.type.startsWith(
                  "video/"
                ) ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="max-h-80 w-full object-contain"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Status preview"
                    className="max-h-80 w-full object-contain"
                  />
                )}
              </div>
            ) : (
              <textarea
                value={caption}
                onChange={(event) =>
                  setCaption(
                    event.target.value
                  )
                }
                placeholder="What's happening?"
                rows={6}
                className="mb-4 w-full resize-none rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
              />
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={
                  handleFileChange
                }
                className="hidden"
              />

              <button
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                📷 Photo / Video
              </button>

              {mediaFile && (
                <button
                  onClick={() => {
                    setMediaFile(null);

                    if (mediaPreview) {
                      URL.revokeObjectURL(
                        mediaPreview
                      );
                    }

                    setMediaPreview("");
                  }}
                  className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600"
                >
                  Remove
                </button>
              )}
            </div>

            {!mediaFile && (
              <div className="mt-3">
                <input
                  value={caption}
                  onChange={(event) =>
                    setCaption(
                      event.target.value
                    )
                  }
                  placeholder="Write your status..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <button
              disabled={posting}
              onClick={postStatus}
              className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {posting
                ? "Posting..."
                : "Post Status"}
            </button>
          </div>
        </div>
      )}

      {viewer && viewerStatus && (
        <div className="fixed inset-0 z-[60] bg-black">
          <div className="absolute left-0 right-0 top-0 z-10 p-4">
            <div className="mb-3 flex gap-1">
              {viewer.statuses.map(
                (status, index) => (
                  <div
                    key={status.id}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
                  >
                    <div
                      className={`h-full ${
                        index <=
                        viewerIndex
                          ? "bg-white"
                          : "bg-transparent"
                      }`}
                    />
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-between text-white">
              <div>
                <div className="font-semibold">
                  {getUserName(
                    viewer.user
                  )}
                </div>

                <div className="text-xs text-white/70">
                  {timeAgo(
                    viewerStatus.created_at
                  )}
                </div>
              </div>

              <button
                onClick={closeViewer}
                className="rounded-full bg-white/10 px-3 py-2"
              >
                ✕
              </button>
            </div>
          </div>

          <button
            onClick={previousStatus}
            className="absolute left-0 top-0 z-10 h-full w-1/3"
            aria-label="Previous status"
          />

          <button
            onClick={nextStatus}
            className="absolute right-0 top-0 z-10 h-full w-1/3"
            aria-label="Next status"
          />

          <div className="flex h-full items-center justify-center px-6">
            {viewerStatus.media_type ===
              "image" &&
            viewerStatus.media_url ? (
              <img
                src={viewerStatus.media_url}
                alt="Status"
                className="max-h-full max-w-full object-contain"
              />
            ) : viewerStatus.media_type ===
                "video" &&
              viewerStatus.media_url ? (
              <video
                src={viewerStatus.media_url}
                autoPlay
                controls
                className="max-h-full max-w-full"
              />
            ) : (
              <div className="w-full max-w-2xl text-center">
                <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-blue-700 px-8 py-16 text-3xl font-bold text-white shadow-2xl">
                  {viewerStatus.caption}
                </div>
              </div>
            )}
          </div>

          {viewerStatus.caption &&
            viewerStatus.media_type !==
              "text" && (
              <div className="absolute bottom-8 left-6 right-6 z-20 rounded-2xl bg-black/50 p-4 text-center text-white">
                {viewerStatus.caption}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
