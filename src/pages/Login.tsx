import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
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
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">Acesso ao sistema</p>
          <h1 className="font-display text-[48px] font-bold leading-[1.06] tracking-[-0.06em] text-[#342d57]">Uma base comum para decisões rastreáveis.</h1>
          <p className="mt-5 text-[15px] leading-7 text-[#8d879d]">Entre para acessar a estrutura do URUCUM e o GPTzinho, seu assistente integrado.</p>
        </section>

        <section className="w-full max-w-[430px] rounded-[26px] border border-[#ebe7f0] bg-white p-6 shadow-[0_18px_45px_rgba(70,58,112,0.08)] sm:p-8">
          <div className="mb-7 lg:hidden">
            <p className="font-display text-[24px] font-bold tracking-[-0.05em] text-[#302a54]">URUCUM<span className="text-[#f08c6c]">.</span></p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d97b0]">Chef Alisson Brilhante</p>
          </div>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            redirectTo={`${window.location.origin}/auth/reset-password`}
            appearance={{
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
            }}
            theme="light"
          />
          <Link to="/auth/forgot-password" className="mt-4 block text-center text-[12px] font-semibold text-[#6d5df5] hover:text-[#5143ce]">
            Esqueci minha senha
          </Link>
        </section>
      </div>
    </main>
  );
}
