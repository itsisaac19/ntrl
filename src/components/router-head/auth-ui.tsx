/** @jsxImportSource react */
import { qwikify$ } from '@builder.io/qwik-react';

import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'

const supabase = createClient(`https://qjpeursbnlmjowsuwigl.supabase.co`, `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcGV1cnNibmxtam93c3V3aWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODU0ODI5OTYsImV4cCI6MjAwMTA1ODk5Nn0.s6bnKJbvt24vwIUIZ83uexzMz6YGyUmPxPC3nzXXQI8`)

interface SupabaseAuthProps {
    view: 'sign_in' | 'sign_up' | 'magic_link' | 'forgotten_password' | 'update_password' | 'verify_otp'
    children: any
}

export const AuthUI = qwikify$((props: SupabaseAuthProps) => {
    const { view } = props;

    supabase.auth.onAuthStateChange((event, session) => {
        console.log({event, session});
        
        if (event === 'SIGNED_OUT') {
            // delete cookies on sign out
            const expires = new Date(0).toUTCString()
            document.cookie = `my-access-token=; path=/; expires=${expires}; SameSite=Lax;`
            document.cookie = `my-refresh-token=; path=/; expires=${expires}; SameSite=Lax;`
            document.cookie = `userid=; path=/; expires=${expires}; SameSite=Lax;`;

        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const maxAge = 100 * 365 * 24 * 60 * 60 // 100 years, never expires
            document.cookie = `my-access-token=${session!.access_token}; path=/; max-age=${maxAge}; SameSite=Lax;`
            document.cookie = `my-refresh-token=${session!.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax;`
            document.cookie = `userid=${session!.user.id}; path=/; max-age=${maxAge}; SameSite=Lax;`;
        }

        if (session?.user) {
            //location.assign('/')
        }

        if (event == 'SIGNED_IN') {
            location.assign('/')
        }
    })

    return (
        <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme='dark'
            redirectTo='/'
            view={view}
        />
    )
}, { eagerness: 'load' })