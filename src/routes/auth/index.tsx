import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

import { AuthUI } from "~/components/router-head/auth-ui";
import ImgNtrlLogo from '~/media/ntrl-logo-dark@2x.png?jsx';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjpeursbnlmjowsuwigl.supabase.co'
const supabaseKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcGV1cnNibmxtam93c3V3aWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODU0ODI5OTYsImV4cCI6MjAwMTA1ODk5Nn0.s6bnKJbvt24vwIUIZ83uexzMz6YGyUmPxPC3nzXXQI8`;
const supabase = createClient(supabaseUrl, supabaseKey)

type viewString = "sign_up" | "sign_in" | "magic_link" | "forgotten_password" | "update_password" | "verify_otp";


export default component$(() => {
    const loaded = useSignal(false);

    const view = useSignal<viewString>('sign_up');

    const initialBuffer = $(() => {
        return new Promise(resolve => {
            setTimeout(resolve, 200);
        })
    })
    
    useVisibleTask$(async () => {
        await initialBuffer();
        loaded.value = true;

        const { data } = await supabase.auth.getSession()
        console.log(data);  
        if (data.session?.user) {
            view.value = 'sign_in';
        }
    })

    return (
        <div class={`auth-wrapper ${loaded.value ? 'loaded' : ''}`}>
            <div class="auth-landing-message">
                <ImgNtrlLogo />
            </div>
            <div class="auth-action-header">
                {view.value == 'sign_up' ? 'Sign up to create your account.' : 'Welcome back. Sign in to continue.'}
            </div>
            {
                //@ts-ignore
                <AuthUI view={view.value} />
            }
            <div class="switcher">
                {view.value === 'sign_up' ? 
                <button onClick$={() => {view.value = 'sign_in'}}>I already have an account</button> 
                : <button onClick$={() => {view.value = 'sign_up'}}>New here? Create a new account</button> }
            </div>
        </div>
    )
})