import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullhorn,
  faSpinner,
  faExclamationTriangle,
  faUsers,
  faCalendar,
  faEye,
  faEdit,
  faTrash,
  faPaperPlane,
  faCheckCircle,
  faTimesCircle,
  faFilter,
  faSort,
  faClock,
  faUser,
  faEnvelope,
  faPlus,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import {
  announcementFilterByAtom,
  announcementsAtom,
  announcementsLoadingAtom,
  announcementSortByAtom,
} from "../../store/announcementsAtoms";
import { studentsAtom } from "../../store/studentsAtoms";
import {
  searchTermAtom,
  showModalAtom,
  modalTypeAtom,
} from "../../store/atoms";
import {
  loadAnnouncements,
  deleteAnnouncement,
  resendAnnouncement,
} from "../../services/announcementsService";
import { NURSING_LEVELS, Announcement } from "../../types";
import { faTelegram } from "@fortawesome/free-brands-svg-icons";

const AnnouncementsList: React.FC = () => {
  const [announcements, setAnnouncements] = useAtom(announcementsAtom);
  const [loading, setLoading] = useAtom(announcementsLoadingAtom);
  const [students] = useAtom(studentsAtom);
  const [searchTerm] = useAtom(searchTermAtom);
  const [sortBy, setSortBy] = useAtom(announcementSortByAtom);
  const [filterBy, setFilterBy] = useAtom(announcementFilterByAtom);
  const [, setShowModal] = useAtom(showModalAtom);
  const [, setModalType] = useAtom(modalTypeAtom);

  // Local filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgentFilter, setUrgentFilter] = useState<string>("all");

  useEffect(() => {
    loadAnnouncementsData();
  }, []);

  const loadAnnouncementsData = async () => {
    setLoading(true);
    try {
      const announcementsData = await loadAnnouncements();
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (
      !window.confirm("Delete this announcement? This action cannot be undone.")
    )
      return;

    try {
      await deleteAnnouncement(announcementId);
      await loadAnnouncementsData();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete announcement. Please try again.");
    }
  };

  const handleResendAnnouncement = async (announcement: Announcement) => {
    if (!window.confirm("Resend this announcement to all recipients?")) return;

    try {
      await resendAnnouncement(announcement);
      alert("Announcement has been resent successfully!");
      await loadAnnouncementsData();
    } catch (error) {
      console.error("Resend error:", error);
      alert("Failed to resend announcement. Please try again.");
    }
  };

  const openAnnouncementModal = () => {
    setModalType("announcement");
    setShowModal(true);
  };

  const openMessageModal = () => {
    setModalType("individual-message");
    setShowModal(true);
  };

  const getFilteredAndSortedAnnouncements = () => {
    const filtered = announcements.filter((announcement) => {
      // Text search
      const matchesSearch =
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.message.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType =
        typeFilter === "all" || announcement.messageType === typeFilter;

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "read" && announcement.readBy.length > 0) ||
        (statusFilter === "unread" && announcement.readBy.length === 0);

      // Urgent filter
      const matchesUrgent =
        urgentFilter === "all" ||
        (urgentFilter === "urgent" && announcement.urgent) ||
        (urgentFilter === "normal" && !announcement.urgent);

      return matchesSearch && matchesType && matchesStatus && matchesUrgent;
    });

    // Sort announcements
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "date":
          return b.createdAt.seconds - a.createdAt.seconds;
        case "type":
          return a.messageType.localeCompare(b.messageType);
        case "urgent":
          return (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0);
        case "readCount":
          return b.readBy.length - a.readBy.length;
        default:
          return b.createdAt.seconds - a.createdAt.seconds;
      }
    });

    return filtered;
  };

  const getTargetAudienceText = (announcement: Announcement) => {
    if (announcement.targetAudience === "all") {
      return "All Students";
    } else if (announcement.targetAudience === "level") {
      return (
        announcement.targetLevels
          ?.map((l) => NURSING_LEVELS.find((nl) => nl.value === l)?.label)
          .join(", ") || "Selected Levels"
      );
    } else if (announcement.targetAudience === "individual") {
      return `${announcement.targetStudents?.length || 0} Selected Students`;
    }
    return "Unknown";
  };

  const getReadPercentage = (announcement: Announcement) => {
    let totalTargets = 0;

    if (announcement.targetAudience === "all") {
      totalTargets = students.length;
    } else if (announcement.targetAudience === "level") {
      totalTargets = students.filter((s) =>
        announcement.targetLevels?.includes(s.nursingLevel)
      ).length;
    } else if (announcement.targetAudience === "individual") {
      totalTargets = announcement.targetStudents?.length || 0;
    }

    return totalTargets > 0
      ? Math.round((announcement.readBy.length / totalTargets) * 100)
      : 0;
  };

  const filteredAnnouncements = getFilteredAndSortedAnnouncements();

  // Statistics
  const stats = {
    total: announcements.length,
    urgent: announcements.filter((a) => a.urgent).length,
    sent: announcements.filter((a) => a.sentToTelegram).length,
    unread: announcements.filter((a) => a.readBy.length === 0).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin text-blue-600 mr-3 text-xl"
        />
        <span className="text-gray-600 text-lg">Loading announcements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon
                icon={faBullhorn}
                className="mr-3 text-purple-600"
              />
              Announcements & Messages
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Communicate with your students through announcements and direct
              messages
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={openMessageModal}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2 text-xs" />
              Individual Message
            </button>
            <button
              onClick={openAnnouncementModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faBullhorn} className="mr-2 text-xs" />
              New Announcement
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-xs text-blue-600">Total Messages</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.urgent}
            </div>
            <div className="text-xs text-red-600">Urgent</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.sent}
            </div>
            <div className="text-xs text-green-600">Sent to Telegram</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.unread}
            </div>
            <div className="text-xs text-yellow-600">Unread</div>
          </div>
        </div> 

        {/* Telegram Status */}
        <div className="mt-4 flex items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200">
          <FontAwesomeIcon icon={faTelegram} className="text-green-600 mr-2" />
          <span className="text-green-700 text-sm font-medium">
            Telegram Integration Active - Connected via TaycaroView
          </span>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faSort} className="text-gray-400 text-sm" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="type">Sort by Type</option>
              <option value="urgent">Sort by Priority</option>
              <option value="readCount">Sort by Read Count</option>
            </select>
          </div>

          {/* Filters */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            <option value="announcement">Announcements</option>
            <option value="individual">Individual Messages</option>
            <option value="resource">Resource Alerts</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="read">Has Reads</option>
            <option value="unread">No Reads</option>
          </select>

          <select
            value={urgentFilter}
            onChange={(e) => setUrgentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent Only</option>
            <option value="normal">Normal Only</option>
          </select>

          {/* Results count */}
          <div className="text-sm text-gray-500 ml-auto">
            Showing {filteredAnnouncements.length} of {announcements.length}{" "}
            messages
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="text-center py-16">
          <FontAwesomeIcon
            icon={faBullhorn}
            className="mx-auto text-gray-400 mb-4 text-6xl"
          />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {announcements.length === 0
              ? "No messages yet"
              : "No messages found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {announcements.length === 0
              ? "Send your first announcement or message to students."
              : "Try adjusting your search terms or filters."}
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={openAnnouncementModal}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <FontAwesomeIcon icon={faBullhorn} className="mr-2" />
              Create Announcement
            </button>
            <button
              onClick={openMessageModal}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
              Send Message
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const readPercentage = getReadPercentage(announcement);
            const isFullyRead = readPercentage === 100;

            return (
              <div
                key={announcement.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-6">
                      {/* Announcement Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {announcement.title}
                            </h3>

                            {/* Type Badge */}
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                announcement.messageType === "announcement"
                                  ? "bg-purple-100 text-purple-800"
                                  : announcement.messageType === "individual"
                                  ? "bg-blue-100 text-blue-800"
                                  : announcement.messageType === "resource"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {announcement.messageType === "announcement" && (
                                <FontAwesomeIcon
                                  icon={faBullhorn}
                                  className="mr-1"
                                />
                              )}
                              {announcement.messageType === "individual" && (
                                <FontAwesomeIcon
                                  icon={faEnvelope}
                                  className="mr-1"
                                />
                              )}
                              {announcement.messageType === "resource" && (
                                <FontAwesomeIcon
                                  icon={faEye}
                                  className="mr-1"
                                />
                              )}
                              {announcement.messageType === "announcement"
                                ? "Announcement"
                                : announcement.messageType === "individual"
                                ? "Individual Message"
                                : announcement.messageType === "resource"
                                ? "Resource Alert"
                                : "Message"}
                            </span>

                            {/* Urgent Badge */}
                            {announcement.urgent && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                <FontAwesomeIcon
                                  icon={faExclamationTriangle}
                                  className="mr-1"
                                />
                                Urgent
                              </span>
                            )}

                            {/* Telegram Badge */}
                            {announcement.sentToTelegram && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <FontAwesomeIcon
                                  icon={faTelegram}
                                  className="mr-1"
                                />
                                Sent to Telegram
                              </span>
                            )}

                            {/* Read Status Badge */}
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                isFullyRead
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : readPercentage > 0
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }`}
                            >
                              <FontAwesomeIcon
                                icon={
                                  isFullyRead
                                    ? faCheckCircle
                                    : readPercentage > 0
                                    ? faClock
                                    : faTimesCircle
                                }
                                className="mr-1"
                              />
                              {isFullyRead
                                ? "All Read"
                                : readPercentage > 0
                                ? `${readPercentage}% Read`
                                : "Unread"}
                            </span>
                          </div>

                          <p className="text-gray-700 text-sm leading-relaxed mb-4">
                            {announcement.message}
                          </p>
                        </div>
                      </div>

                      {/* Announcement Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faUsers} className="mr-2" />
                          <strong className="text-gray-700">
                            {getTargetAudienceText(announcement)}
                          </strong>
                        </span>
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                          {announcement.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString()}{" "}
                          at{" "}
                          {announcement.createdAt
                            ?.toDate?.()
                            ?.toLocaleTimeString()}
                        </span>
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faUser} className="mr-2" />
                          {announcement.createdBy || "Instructor"}
                        </span>
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faEye} className="mr-2" />
                          {announcement.readBy.length} read
                        </span>
                      </div>

                      {/* Read Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            Read Progress
                          </span>
                          <span className="text-xs text-gray-500">
                            {readPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isFullyRead
                                ? "bg-green-500"
                                : readPercentage > 0
                                ? "bg-yellow-500"
                                : "bg-gray-300"
                            }`}
                            style={{ width: `${readPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Resource Link (if applicable) */}
                      {announcement.resourceId && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800">
                            <FontAwesomeIcon icon={faEye} className="mr-2" />
                            <strong>Related Resource:</strong> This announcement
                            is about a new study resource.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleResendAnnouncement(announcement)}
                        className="flex items-center justify-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300 text-sm"
                        title="Resend Announcement"
                      >
                        <FontAwesomeIcon
                          icon={faPaperPlane}
                          className="mr-2 text-xs"
                        />
                        Resend
                      </button>

                      <button
                        className="flex items-center justify-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300 text-sm"
                        title="Edit Announcement"
                        disabled
                      >
                        <FontAwesomeIcon
                          icon={faEdit}
                          className="mr-2 text-xs"
                        />
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteAnnouncement(announcement.id)
                        }
                        className="flex items-center justify-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300 text-sm"
                        title="Delete Announcement"
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="mr-2 text-xs"
                        />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer with additional info */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Message ID: {announcement.id.slice(-8)}</span>
                    <span>
                      {announcement.sentToTelegram
                        ? "Delivered via Telegram"
                        : "App notification only"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show results count */}
      {filteredAnnouncements.length > 0 &&
        filteredAnnouncements.length !== announcements.length && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Showing {filteredAnnouncements.length} of {announcements.length}{" "}
              messages
              {searchTerm && (
                <span>
                  {" "}
                  matching &quot;<strong>{searchTerm}</strong>&quot;
                </span>
              )}
            </p>
          </div>
        )}
    </div>
  );
};

export default AnnouncementsList;
