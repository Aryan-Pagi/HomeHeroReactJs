import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowRight,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { verificationAPI } from "../services/api";

function ProviderVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const [formData, setFormData] = useState({
    services: [],
    experience_years: 0,
    pricing: 0,
    service_radius: 10,
    work_description: "",
    documents: [],
  });

  const [uploadedDocuments, setUploadedDocuments] = useState({
    id_proof: null,
    address_proof: null,
    work_certificate: null,
    license: null,
  });

  const servicesList = [
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Cleaning",
    "AC Repair",
    "Appliance Repair",
    "Pest Control",
  ];

  useEffect(() => {
    // Redirect if not a provider
    if (user && user.user_type !== "provider") {
      navigate("/");
    }

    // Check existing verification status
    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    try {
      const status = await verificationAPI.getStatus();
      setVerificationStatus(status);
      
      if (status.verification_status === "approved") {
        // Already approved, redirect to dashboard
        navigate("/provider-dashboard");
      }
    } catch (err) {
      console.error("Error checking status:", err);
      // If endpoint doesn't exist yet (404), just continue with form
      if (err.status === 404) {
        console.log("Verification endpoint not available yet, showing form");
      } else {
        setError("Failed to check verification status. Please continue with the form.");
      }
    }
  };

  const handleServiceToggle = (service) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, or PDF files are allowed");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload document
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      const response = await verificationAPI.uploadDocument(documentType, file);

      // Update uploaded documents state
      setUploadedDocuments((prev) => ({
        ...prev,
        [documentType]: {
          url: response.document_url,
          filename: file.name,
        },
      }));

      alert(`${documentType} uploaded successfully!`);
    } catch (err) {
      console.error("Upload error:", err);
      
      // Handle 404 - endpoint not deployed yet
      if (err.status === 404) {
        // For demo purposes, create a mock upload URL
        const mockUrl = `https://storage.homehero.com/documents/${documentType}/${Date.now()}_${file.name}`;
        
        setUploadedDocuments((prev) => ({
          ...prev,
          [documentType]: {
            url: mockUrl,
            filename: file.name,
          },
        }));
        
        alert(`${documentType} uploaded successfully (demo mode)!`);
      } else {
        setError(err.detail || "Failed to upload document");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Prepare documents array
      const documents = [];
      Object.entries(uploadedDocuments).forEach(([type, doc]) => {
        if (doc && doc.url) {
          documents.push({
            document_type: type,
            document_url: doc.url,
          });
        }
      });

      if (documents.length < 2) {
        setError("Please upload at least ID proof and Address proof");
        setLoading(false);
        return;
      }

      const verificationData = {
        services: formData.services,
        experience_years: parseInt(formData.experience_years),
        pricing: parseFloat(formData.pricing),
        service_radius: parseFloat(formData.service_radius),
        work_description: formData.work_description || null,
        documents: documents,
      };

      const response = await verificationAPI.submitVerification(verificationData);

      setSuccess(true);
      setVerificationStatus({
        verification_status: response.verification_status,
        message: response.message,
      });

      // Redirect based on status
      setTimeout(() => {
        if (response.verification_status === "approved") {
          navigate("/provider-dashboard");
        } else {
          // Show pending message
          setStep(4); // Final step
        }
      }, 2000);
    } catch (err) {
      console.error("Verification error:", err);
      
      // Handle 404 - endpoint not deployed yet
      if (err.status === 404) {
        setError("Verification system is being updated. Please try again later or contact support.");
      } else {
        setError(err.detail || "Failed to submit verification");
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validation for each step
    if (step === 1) {
      if (formData.services.length === 0) {
        setError("Please select at least one service");
        return;
      }
      if (formData.pricing <= 0) {
        setError("Please enter a valid pricing");
        return;
      }
    }

    if (step === 2) {
      if (!uploadedDocuments.id_proof) {
        setError("Please upload ID proof");
        return;
      }
      if (!uploadedDocuments.address_proof) {
        setError("Please upload Address proof");
        return;
      }
    }

    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Service Details</h3>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Services Offered <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {servicesList.map((service) => (
            <label
              key={service}
              className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                formData.services.includes(service)
                  ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                  : "border-gray-200 hover:border-cyan-300 text-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={formData.services.includes(service)}
                onChange={() => handleServiceToggle(service)}
                className="mr-2 accent-cyan-500"
              />
              <span className="font-medium text-sm">{service}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Years of Experience <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.experience_years}
            onChange={(e) =>
              setFormData({ ...formData, experience_years: e.target.value })
            }
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            placeholder="e.g., 5"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pricing (₹/hour) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={formData.pricing}
            onChange={(e) =>
              setFormData({ ...formData, pricing: e.target.value })
            }
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            placeholder="e.g., 500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Service Radius (km)
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={formData.service_radius}
          onChange={(e) =>
            setFormData({ ...formData, service_radius: e.target.value })
          }
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          placeholder="e.g., 10"
        />
        <p className="text-xs text-gray-500 mt-1">
          How far you're willing to travel for jobs
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Work Description
          {formData.experience_years >= 5 && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        <textarea
          value={formData.work_description}
          onChange={(e) =>
            setFormData({ ...formData, work_description: e.target.value })
          }
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none"
          rows="4"
          placeholder="Describe your work experience, specializations, and notable projects..."
          required={formData.experience_years >= 5}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.experience_years >= 5
            ? "Required for providers with 5+ years experience"
            : "Optional but recommended"}
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Document Verification
      </h3>
      <p className="text-gray-600 mb-6">
        Upload clear images or PDFs of your documents. All documents are securely encrypted.
      </p>

      {/* ID Proof */}
      <div className="border-2 border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-600" />
          ID Proof <span className="text-red-500">*</span>
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Aadhar, Passport, Driving License, or Voter ID
        </p>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => handleFileUpload("id_proof", e.target.files[0])}
          className="w-full"
        />
        {uploadedDocuments.id_proof && (
          <div className="mt-2 flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{uploadedDocuments.id_proof.filename}</span>
          </div>
        )}
      </div>

      {/* Address Proof */}
      <div className="border-2 border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-600" />
          Address Proof <span className="text-red-500">*</span>
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Aadhar, Passport, Utility Bill, or Rental Agreement
        </p>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => handleFileUpload("address_proof", e.target.files[0])}
          className="w-full"
        />
        {uploadedDocuments.address_proof && (
          <div className="mt-2 flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{uploadedDocuments.address_proof.filename}</span>
          </div>
        )}
      </div>

      {/* Work Certificate (Optional) */}
      <div className="border-2 border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          Work Certificate <span className="text-gray-500">(Optional)</span>
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Previous employer certificates or work completion letters
        </p>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => handleFileUpload("work_certificate", e.target.files[0])}
          className="w-full"
        />
        {uploadedDocuments.work_certificate && (
          <div className="mt-2 flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{uploadedDocuments.work_certificate.filename}</span>
          </div>
        )}
      </div>

      {/* License (Optional) */}
      <div className="border-2 border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          Professional License <span className="text-gray-500">(Optional)</span>
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Trade license, certification, or professional registration
        </p>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => handleFileUpload("license", e.target.files[0])}
          className="w-full"
        />
        {uploadedDocuments.license && (
          <div className="mt-2 flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{uploadedDocuments.license.filename}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Review & Submit</h3>

      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Services</h4>
          <p className="text-gray-900">{formData.services.join(", ")}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Experience</h4>
            <p className="text-gray-900">{formData.experience_years} years</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Pricing</h4>
            <p className="text-gray-900">₹{formData.pricing}/hour</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Documents Uploaded</h4>
          <ul className="space-y-1">
            {Object.entries(uploadedDocuments).map(([type, doc]) =>
              doc ? (
                <li key={type} className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                </li>
              ) : null
            )}
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <Shield className="inline h-4 w-4 mr-2" />
          Your documents will be verified automatically. If approved, you'll receive
          instant access to start receiving bookings!
        </p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      {verificationStatus?.verification_status === "approved" ? (
        <>
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">Approved!</h3>
          <p className="text-gray-600 text-lg">{verificationStatus.message}</p>
          <button
            onClick={() => navigate("/provider-dashboard")}
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all"
          >
            Go to Dashboard
          </button>
        </>
      ) : (
        <>
          <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-16 w-16 text-yellow-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">Under Review</h3>
          <p className="text-gray-600 text-lg">
            {verificationStatus?.message ||
              "Your documents are being reviewed. We'll notify you once approved."}
          </p>
          <p className="text-sm text-gray-500">
            This usually takes 1-2 business days.
          </p>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? "bg-cyan-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Service Details</span>
            <span>Documents</span>
            <span>Review</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <p className="text-green-700 text-sm">
                Verification submitted successfully!
              </p>
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={step === 1 || loading}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              {step < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Submit for Verification
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProviderVerification;
