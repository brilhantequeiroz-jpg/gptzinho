import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const appearance = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: "#6d5df5",
        brandAccent: "#5b4ada",
        inputBorder: "#e5e1ee",
        inputBackground: "#fbfaf8",
      },
      radii: {
        borderRadiusButton: "12px",
        buttonBorderRadius: "12px",
        inputBorderRadius: "12px",
      },
    },
  },
};

function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#fbfaf8] px-5 py-10 text-[#28233f] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1040px] items-center justify-center gap-16 lg:justify-between">
        <section className="hidden max-w-[430px] lg:block">
          <div className="mb-7 flex items-center gap-3">
            <img src="/avatar_alisson_brilhante.png" alt="Alisson Brilhante" className="h-11 w-11 rounded-[15px] object-cover shadow-[0_9px_20px_rgba(109,93,245,0.22)]" />
            <div>
              <p className="font-display text-[22px] font-bold tracking-[-0.05em] text-[#302a54]">URUCUM<span className="text-[#f08c6c]">.</span></p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d97b0]">Chef Alisson Brilhante</p>
            </div>
          </div>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">{eyebrow}</p>
          <h1 className="font-display text-[48px] font-bold leading-[1.06] tracking-[-0.06em] text-[#342d57]">{title}</h1>
          <p className="mt-5 text-[15px] leading-7 text-[#8d879d]">{description}</p>
        </section>

        <section className="w-full max-w-[430px] rounded-[26px] border border-[#ebe7f0] bg-white p-6 shadow-[0_18px_45px_rgba(70,58,112,0.08)] sm:p-8">
          <div className="mb-7 lg:hidden">
            <p className="font-display text-[24px] font-bold tracking-[-0.05em] text-[#302a54]">URUCUM<span className="text-[#f08c6c]">.</span></p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d97b0]">Chef Alisson Brilhante</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export function ForgotPassword() {
  return (
    <AuthShell
      eyebrow="Recuperar acesso"
      title="Vamos recuperar seu acesso."
      description="Informe o e-mail da sua conta e enviaremos um link seguro para criar uma nova senha."
    >
      <Auth
        supabaseClient={supabase}
        view="forgotten_password"
        redirectTo={`${window.location.origin}/auth/reset-password`}
        providers={[]}
        appearance={appearance}
        theme="light"
      />
      <Link to="/auth" className="mt-5 block text-center text-[12px] font-semibold text-[#6d5df5] hover:text-[#5143ce]">
        Voltar para o acesso
      </Link>
    </AuthShell>
  );
}

export function ResetPassword() {
  return (
    <AuthShell
      eyebrow="Nova senha"
      title="Escolha uma nova senha."
      description="Defina uma senha nova para voltar ao sistema com segurança."
    >
      <Auth
        supabaseClient={supabase}
        view="update_password"
        providers={[]}
        appearance={appearance}
        theme="light"
      />
      <Link to="/auth/forgot-password" className="mt-5 block text-center text-[12px] font-semibold text-[#6d5df5] hover:text-[#5143ce]">
        Solicitar um novo link
      </Link>
    </AuthShell>
  );
}
