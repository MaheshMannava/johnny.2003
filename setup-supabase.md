# Setting Up Supabase Authentication

To use the authentication features, you need to set up a Supabase project and update the configuration in your code.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign up or log in
2. Create a new project
3. Give your project a name (e.g., "johnny-2003-store")
4. Set a secure database password
5. Choose a region close to your users
6. Wait for your project to be created (usually takes about 1 minute)

## 2. Configure Authentication Settings

1. In your Supabase project dashboard, go to "Authentication" in the left sidebar
2. Under "URL Configuration", add your website URL to the "Site URL" field
   - For local development, you can use `http://localhost:8000` if you're using a local server
   - For production, use your actual domain (e.g., `https://johnny2003.com`)
3. Under "Email Templates", you can customize the emails sent for verification, password reset, etc.

## 3. Get Your API Keys

1. In your Supabase project dashboard, go to "Settings" → "API" in the left sidebar
2. You'll see two keys:
   - `anon public`: This is the key you'll use in your client-side code (it's safe to expose)
   - `service_role`: Keep this one secret! Don't use it in client-side code.

## 4. Update Your Configuration

1. Open the file `assets/js/supabase.js`
2. Replace the placeholder values with your actual Supabase project URL and anon key:

```javascript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseAnonKey = 'your-anon-key';
```

## Testing Authentication

After completing the setup:

1. Launch your website using a local server (e.g., `python -m http.server 8000`)
2. Click on the "Register" button to create a new account
3. Check your email for the verification link
4. Once verified, you should be able to log in and access the purchasing features

## Troubleshooting

- **Email verification not working**: Ensure your Site URL is correctly configured in Supabase
- **Cannot log in**: Check the browser console for error messages
- **Auth modal not appearing**: Ensure the JavaScript files are correctly loaded

If you encounter any issues, you can refer to the [Supabase documentation](https://supabase.com/docs/guides/auth). 