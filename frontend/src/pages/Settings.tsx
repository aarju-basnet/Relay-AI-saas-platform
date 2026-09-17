import { useState, useEffect } from "react";

// All Settings Page Imports
import AccountSetting from "@/components/AccountSetting";
import WorkspaceSetting from "@/Settings/WorkspaceSetting";
import TeamSetting from "@/Settings/TeamSetting";
import BillingSetting from "@/Settings/BillingSetting";
import SecuritySetting from "@/Settings/SecuritySetting";
import NotificationSetting from "@/Settings/NotificationSetting";
import ApiKeySetting from "@/Settings/ApiKeySetting";
import AppearanceSetting from "@/Settings/AppearanceSetting";
import AdvancedSetting from "@/Settings/AdvancedSetting";
import UsageSetting from "@/Settings/UsageSetting";

interface SettingsProps {
  settingsPage?: string;
  onNavigate?: (page: string) => void;
}

export default function Settings({
  settingsPage: externalPage = "account",
  onNavigate,
}: SettingsProps) {
  // Local state enables switching views directly inside Settings
  const [currentPage, setCurrentPage] = useState(externalPage);

  // Sync internal state if the parent passes a new settingsPage prop
  useEffect(() => {
    setCurrentPage(externalPage);
  }, [externalPage]);

  // Handle navigation internally and notify parent if callback exists
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    onNavigate?.(page);
  };

  return (
    <div className="p-7">
      {currentPage === "account" && (
        <AccountSetting onNavigate={handleNavigate} />
      )}

      {currentPage === "workspace" && <WorkspaceSetting />}

      {currentPage === "team" && <TeamSetting />}

      {currentPage === "billing" && <BillingSetting />}

      {currentPage === "security" && <SecuritySetting />}

      {currentPage === "notifications" && <NotificationSetting />}

      {currentPage === "apikeys" && <ApiKeySetting />}

      {currentPage === "appearance" && <AppearanceSetting />}

      {currentPage === "advanced" && <AdvancedSetting />}
      {currentPage === "usage" && <UsageSetting />}
    </div>
  );
}