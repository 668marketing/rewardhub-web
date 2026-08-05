export type PermissionItem = {
  key: string;
  label: string;
};

export type PermissionGroup = {
  title: string;
  permissions: PermissionItem[];
};

export const PERMISSION_CATALOG: PermissionGroup[] = [
  {
    title: "Overview",
    permissions: [
      { key: "dashboard.view", label: "View Dashboard" },
    ],
  },
  {
    title: "Members",
    permissions: [
      { key: "members.view", label: "View Members" },
      { key: "members.create", label: "Create Members" },
      { key: "members.update", label: "Update Members" },
      { key: "members.status", label: "Change Member Status" },
      { key: "members.export", label: "Export Members" },
      { key: "members.support", label: "Provide Member Support" },
    ],
  },
  {
    title: "Merchants",
    permissions: [
      { key: "merchants.view", label: "View Merchants" },
      { key: "merchants.create", label: "Create Merchants" },
      { key: "merchants.update", label: "Update Merchants" },
      { key: "merchants.status", label: "Change Merchant Status" },
      { key: "merchants.approve", label: "Approve Merchant Applications" },
      { key: "merchants.reject", label: "Reject Merchant Applications" },
      { key: "merchants.export", label: "Export Merchants" },
      { key: "merchants.support", label: "Provide Merchant Support" },
    ],
  },
  {
    title: "Transactions",
    permissions: [
      { key: "transactions.view", label: "View Transactions" },
      { key: "transactions.manage", label: "Manage Transactions" },
      { key: "transactions.export", label: "Export Transactions" },
      { key: "transactions.receipt", label: "View Transaction Receipts" },
    ],
  },
  {
    title: "Settlements",
    permissions: [
      { key: "settlements.view", label: "View Settlements" },
      { key: "settlements.manage", label: "Manage Settlements" },
      { key: "settlements.approve", label: "Approve Settlements" },
      { key: "settlements.reject", label: "Reject Settlements" },
      { key: "settlements.receipt", label: "Manage Settlement Receipts" },
      { key: "settlements.export", label: "Export Settlements" },
    ],
  },
  {
    title: "Marketing Budget",
    permissions: [
      { key: "marketing.view", label: "View Marketing Budget" },
      { key: "marketing.update", label: "Update Marketing Budget" },
    ],
  },
  {
    title: "Reward Credits",
    permissions: [
      { key: "reward_credits.view", label: "View Reward Credits" },
      { key: "reward_credits.adjust", label: "Adjust Reward Credits" },
      { key: "reward_credits.export", label: "Export Reward Credits" },
    ],
  },
  {
    title: "Points",
    permissions: [
      { key: "points.view", label: "View Points" },
      { key: "points.adjust", label: "Adjust Points" },
      { key: "points.export", label: "Export Points" },
    ],
  },
  {
    title: "Card Applications",
    permissions: [
      { key: "cards.view", label: "View Card Applications" },
      { key: "cards.manage", label: "Manage Card Applications" },
      { key: "cards.approve", label: "Approve Card Applications" },
      { key: "cards.reject", label: "Reject Card Applications" },
    ],
  },
  {
    title: "Rewards",
    permissions: [
      { key: "rewards.view", label: "View Rewards" },
      { key: "rewards.create", label: "Create Rewards" },
      { key: "rewards.update", label: "Update Rewards" },
      { key: "rewards.delete", label: "Delete Rewards" },
      { key: "rewards.redemptions", label: "Manage Reward Redemptions" },
    ],
  },
  {
    title: "Products",
    permissions: [
      { key: "products.view", label: "View Products" },
      { key: "products.manage", label: "Manage Products" },
      { key: "products.create", label: "Create Products" },
      { key: "products.update", label: "Update Products" },
      { key: "products.approve", label: "Approve Products" },
      { key: "products.delete", label: "Delete Products" },
    ],
  },
  {
    title: "Reviews",
    permissions: [
      { key: "reviews.view", label: "View Reviews" },
      { key: "reviews.manage", label: "Manage Reviews" },
      { key: "reviews.reply", label: "Reply to Reviews" },
      { key: "reviews.hide", label: "Hide Reviews" },
      { key: "reviews.delete", label: "Delete Reviews" },
      { key: "reviews.pin", label: "Pin Reviews" },
    ],
  },
  {
    title: "Notifications",
    permissions: [
      { key: "notifications.view", label: "View Notifications" },
      { key: "notifications.send", label: "Send Notifications" },
      { key: "notifications.delete", label: "Delete Notification History" },
    ],
  },
  {
    title: "Campaigns",
    permissions: [
      { key: "campaigns.view", label: "View Campaigns" },
      { key: "campaigns.create", label: "Create Campaigns" },
      { key: "campaigns.update", label: "Update Campaigns" },
      { key: "campaigns.send", label: "Send Campaigns" },
      { key: "campaigns.schedule", label: "Schedule Campaigns" },
      { key: "campaigns.cancel", label: "Cancel Campaigns" },
      { key: "campaigns.delete", label: "Delete Campaigns" },
    ],
  },
  {
    title: "Reports",
    permissions: [
      { key: "reports.view", label: "View Reports" },
      { key: "reports.export", label: "Export Reports" },
    ],
  },
  {
    title: "Admin Users",
    permissions: [
      { key: "admin_users.view", label: "View Administrators" },
      { key: "admin_users.create", label: "Create Administrators" },
      { key: "admin_users.update", label: "Update Administrators" },
      { key: "admin_users.status", label: "Change Administrator Status" },
      { key: "admin_users.reset_password", label: "Reset Administrator Passwords" },
      { key: "admin_users.revoke_sessions", label: "Revoke Administrator Sessions" },
      { key: "admin_users.permissions", label: "Manage Administrator Permissions" },
    ],
  },
  {
    title: "Settings",
    permissions: [
      { key: "settings.view", label: "View Settings" },
      { key: "settings.update", label: "Update Settings" },
    ],
  },
  {
    title: "Search",
    permissions: [
      { key: "search.use", label: "Use Global Search" },
    ],
  },
  {
    title: "Admin Profile",
    permissions: [
      { key: "admin_profile.view", label: "View Own Admin Profile" },
      { key: "admin_profile.update", label: "Update Own Admin Profile" },
      { key: "admin_profile.change_password", label: "Change Own Password" },
    ],
  },
  {
    title: "Audit Logs",
    permissions: [
      { key: "audit_logs.view", label: "View Audit Logs" },
      { key: "audit_logs.export", label: "Export Audit Logs" },
    ],
  },
];