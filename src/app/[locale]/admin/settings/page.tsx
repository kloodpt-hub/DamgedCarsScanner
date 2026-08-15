import { getDictionary, type Locale } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import {
  KeyRound,
  Mail,
  Send,
  Bell,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";

const GOOGLE_REDIRECT_URI =
  "https://damged-cars-scanner-native.onrender.com/api/auth/callback/google";

function maskValue(value: string | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}

function StatusBadge({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <Badge variant="success" className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        Configured
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <ShieldAlert className="h-3 w-3" />
      Not Configured
    </Badge>
  );
}

function SettingRow({
  label,
  envVar,
  value,
  configured,
  copyable = true,
  isRtl,
}: {
  label: string;
  envVar: string;
  value: string;
  configured: boolean;
  copyable?: boolean;
  isRtl: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-3 bg-surface/50 space-y-2">
      <div
        className={`flex items-center justify-between gap-2 ${
          isRtl ? "flex-row-reverse" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-text">{label}</span>
          <code className="text-xs text-text-muted bg-bg px-1.5 py-0.5 rounded min-w-0 break-all">
            {envVar}
          </code>
        </div>
        <StatusBadge configured={configured} />
      </div>
      <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className="flex-1 min-w-0 rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-text truncate">
          {configured ? maskValue(value) : <span className="text-text-muted">— not set —</span>}
        </div>
        {copyable && configured && <CopyButton value={value} />}
      </div>
    </div>
  );
}

function StepList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal list-inside space-y-2 text-sm text-text-muted mt-2">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = "en" } = await params;
  const t = await getDictionary(locale as Locale);
  const isRtl = locale === "ar";

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramBotUsername = process.env.TELEGRAM_BOT_USERNAME;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  return (
    <div className="space-y-6">
      <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
        <div>
          <h1 className="text-2xl font-bold text-text">{t.common.settings}</h1>
          <p className="text-text-muted text-sm mt-1">
            Configure OAuth, email, Telegram, and web push credentials. Values are
            stored as environment variables on Render.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface/30 p-4 text-sm text-text-muted">
        <p className="font-medium text-text mb-1">How to update these settings</p>
        <p>
          Environment variables cannot be edited from the app directly. To change a
          value, go to your{" "}
          <a
            href="https://dashboard.render.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Render dashboard
            <ExternalLink className="h-3 w-3" />
          </a>
          , open the <code className="text-primary">damged-cars-scanner-native</code>{" "}
          service, and add or update the variable under{" "}
          <strong>Environment</strong>. Redeploy for changes to take effect.
        </p>
      </div>

      {/* Section 1: Google OAuth Setup */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <KeyRound className="h-5 w-5 text-primary" />
            <span>Google OAuth Setup</span>
          </CardTitle>
          <CardDescription>
            Credentials used by NextAuth for Google sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Client ID"
            envVar="GOOGLE_CLIENT_ID"
            value={googleClientId ?? ""}
            configured={!!googleClientId}
            isRtl={isRtl}
          />
          <SettingRow
            label="Client Secret"
            envVar="GOOGLE_CLIENT_SECRET"
            value={googleClientSecret ?? ""}
            configured={!!googleClientSecret}
            isRtl={isRtl}
          />

          <div className="rounded-lg border border-border p-4 bg-surface/50 space-y-2">
            <div className={`flex items-center justify-between gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-text">Redirect URI</span>
                <code className="text-xs text-text-muted bg-bg px-1.5 py-0.5 rounded">
                  Authorized redirect URI
                </code>
              </div>
              <Badge variant="default">Required</Badge>
            </div>
            <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="flex-1 min-w-0 rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-text truncate">
                {GOOGLE_REDIRECT_URI}
              </div>
              <CopyButton value={GOOGLE_REDIRECT_URI} />
            </div>
            <p className="text-xs text-text-muted mt-1">
              Add this exact URI to your Google Cloud Console OAuth client under
              <strong> Authorized redirect URIs</strong>.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 bg-surface/50 text-sm text-text-muted">
            <p className="font-medium text-text mb-1">Google OAuth setup steps</p>
            <StepList
              items={[
                <>
                  Go to the{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Google Cloud Console credentials page
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>,
                <>
                  Create a project (or select an existing one) and enable the{" "}
                  <strong>Google+ API</strong> / <strong>Identity Services</strong>.
                </>,
                <>
                  Click <strong>Create Credentials</strong> &rarr;{" "}
                  <strong>OAuth client ID</strong>, choose{" "}
                  <strong>Web application</strong>.
                </>,
                <>
                  Under <strong>Authorized redirect URIs</strong>, paste the redirect
                  URI shown above.
                </>,
                <>
                  Copy the generated <strong>Client ID</strong> and{" "}
                  <strong>Client Secret</strong> and set them as{" "}
                  <code className="text-primary">GOOGLE_CLIENT_ID</code> and{" "}
                  <code className="text-primary">GOOGLE_CLIENT_SECRET</code> on Render.
                </>,
                <>Redeploy the service so NextAuth picks up the new credentials.</>,
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Mail className="h-5 w-5 text-primary" />
            <span>Email Configuration</span>
          </CardTitle>
          <CardDescription>
            Resend is used to send notification emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Resend API Key"
            envVar="RESEND_API_KEY"
            value={resendApiKey ?? ""}
            configured={!!resendApiKey}
            isRtl={isRtl}
          />
          <SettingRow
            label="From Email"
            envVar="FROM_EMAIL"
            value={fromEmail ?? ""}
            configured={!!fromEmail}
            isRtl={isRtl}
          />

          <div className="rounded-lg border border-border p-4 bg-surface/50 text-sm text-text-muted">
            <p className="font-medium text-text mb-1">Resend email setup steps</p>
            <StepList
              items={[
                <>
                  Sign up at{" "}
                  <a
                    href="https://resend.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    resend.com
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  and create an API key.
                </>,
                <>
                  (Optional) Verify your sending domain under{" "}
                  <strong>Domains</strong> so emails are not sent from the sandbox.
                </>,
                <>
                  Set <code className="text-primary">RESEND_API_KEY</code> to your{" "}
                  <code className="text-primary">re_...</code> key on Render.
                </>,
                <>
                  Set <code className="text-primary">FROM_EMAIL</code> to the address
                  emails should be sent from (e.g.{" "}
                  <code className="text-primary">noreply@yourdomain.com</code>).
                </>,
                <>Redeploy the service for changes to take effect.</>,
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Telegram Bot */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Send className="h-5 w-5 text-accent" />
            <span>Telegram Bot</span>
          </CardTitle>
          <CardDescription>
            Bot credentials for sending Telegram notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Bot Username"
            envVar="TELEGRAM_BOT_USERNAME"
            value={telegramBotUsername ?? ""}
            configured={!!telegramBotUsername}
            isRtl={isRtl}
          />
          <SettingRow
            label="Bot Token"
            envVar="TELEGRAM_BOT_TOKEN"
            value={telegramBotToken ?? ""}
            configured={!!telegramBotToken}
            isRtl={isRtl}
          />

          <div className="rounded-lg border border-border p-4 bg-surface/50 text-sm text-text-muted">
            <p className="font-medium text-text mb-1">Telegram bot setup steps</p>
            <StepList
              items={[
                <>
                  Open Telegram and message{" "}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @BotFather
                  </a>
                  .
                </>,
                <>Send <code className="text-primary">/newbot</code> and follow the prompts to name it.</>,
                <>
                  Copy the token BotFather returns and set it as{" "}
                  <code className="text-primary">TELEGRAM_BOT_TOKEN</code> on Render.
                </>,
                <>
                  Set <code className="text-primary">TELEGRAM_BOT_USERNAME</code> to the
                  bot&apos;s username (without the leading <code>@</code>).
                </>,
                <>Redeploy the service for changes to take effect.</>,
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Web Push (VAPID) */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Bell className="h-5 w-5 text-success" />
            <span>Web Push (VAPID)</span>
          </CardTitle>
          <CardDescription>
            VAPID key pair used for browser web push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="VAPID Public Key"
            envVar="NEXT_PUBLIC_VAPID_PUBLIC_KEY"
            value={vapidPublic ?? ""}
            configured={!!vapidPublic}
            isRtl={isRtl}
          />
          <SettingRow
            label="VAPID Private Key"
            envVar="VAPID_PRIVATE_KEY"
            value={vapidPrivate ?? ""}
            configured={!!vapidPrivate}
            isRtl={isRtl}
          />

          <div className="rounded-lg border border-border p-4 bg-surface/50 text-sm text-text-muted">
            <p className="font-medium text-text mb-1">Web push setup steps</p>
            <StepList
              items={[
                <>
                  Generate a VAPID key pair locally with{" "}
                  <code className="text-primary">npx web-push generate-vapid-keys</code>.
                </>,
                <>
                  Set the public key as{" "}
                  <code className="text-primary">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> and
                  the private key as{" "}
                  <code className="text-primary">VAPID_PRIVATE_KEY</code> on Render.
                </>,
                <>Redeploy the service for changes to take effect.</>,
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
