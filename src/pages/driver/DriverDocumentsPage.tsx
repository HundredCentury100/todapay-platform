import { KYC_REQUIREMENTS } from "@/components/kyc/KYCDocumentRequirements";
import KYCDocumentUploader from "@/components/kyc/KYCDocumentUploader";

const DriverDocumentsPage = () => {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload and manage your driver documents
        </p>
      </div>

      <KYCDocumentUploader
        entityType="driver"
        requirements={KYC_REQUIREMENTS.driver}
      />
    </div>
  );
};

export default DriverDocumentsPage;
