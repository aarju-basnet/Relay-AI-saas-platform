import WorkspaceSetting from "@/Settings/WorkspaceSetting";
import TeamSetting from "@/Settings/TeamSetting";

// These will be created later
import AssistantSetting from '@/Settings/AssistantSetting';
import BillingSetting from '@/Settings/BillingSetting';
import SecuritySetting from "@/Settings/SecuritySetting";
import NotificationSetting from "@/Settings/NotificationSetting";
import ApiKeySetting from "@/Settings/ApiKeySetting";
import IntegrationSetting from "@/Settings/IntegrationSetting";
import AppearanceSetting from "@/Settings/AppearanceSetting";
import AdvancedSetting from "@/Settings/AdvancedSetting";

interface SettingsProps {
  settingsPage: string;
}

export default function Settings({
  settingsPage,
}: SettingsProps) {
  return (
    <div className="p-8">

      {settingsPage === "workspace" && <WorkspaceSetting />}

      {settingsPage === "assistant" && <AssistantSetting />}

      {settingsPage === "team" && <TeamSetting />}

      {settingsPage === "billing" && <BillingSetting />}

      {settingsPage === "security" && <SecuritySetting />}

      {settingsPage === "notifications" && (
        <NotificationSetting />
      )}

      {settingsPage === "apikeys" && <ApiKeySetting />}

      {settingsPage === "integrations" && (
        <IntegrationSetting />
      )}

      {settingsPage === "appearance" && (
        <AppearanceSetting />
      )}

      {settingsPage === "advanced" && <AdvancedSetting />}

    </div>
  );
}