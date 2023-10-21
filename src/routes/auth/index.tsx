import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

import { AuthUI } from "~/components/router-head/auth-ui";
import ImgNtrlLogo from '~/media/ntrl-logo-dark@2x.png?jsx';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjpeursbnlmjowsuwigl.supabase.co'
const supabaseKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcGV1cnNibmxtam93c3V3aWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODU0ODI5OTYsImV4cCI6MjAwMTA1ODk5Nn0.s6bnKJbvt24vwIUIZ83uexzMz6YGyUmPxPC3nzXXQI8`;
const supabase = createClient(supabaseUrl, supabaseKey)

export default component$(() => {
    const loaded = useSignal(false);

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
    })

    return (
        <div class={`auth-wrapper ${loaded.value ? 'loaded' : ''}`}>
            <div class="auth-landing-message">
                <ImgNtrlLogo />
            </div>
            {
                //@ts-ignore
                <AuthUI view={'sign_up'} />
            }
        </div>
    )
})