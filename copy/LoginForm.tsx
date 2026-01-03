import { useState, FormEvent } from 'react';
import { IoEye, IoEyeOff } from 'react-icons/io5';
import { LuMoveRight } from "react-icons/lu";
import { sanitizeTextInput } from './src/utils/sanitize';
import { validateNoScriptTags } from './src/utils/validators';
import LoadingButton from './src/components/LoadingButton';
import FormError from './src/components/FormError';
import { generateAriaId } from './src/utils/a11y';
import logger from './src/utils/logger';

// The background image
const backgroundImg = 'https://applescoop.org/image/wallpapers/ipad/39555922105788908-33106927849764161.jpg';

function LoginForm() {
    // State to manage password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Generate ARIA IDs
    const usernameErrorId = generateAriaId('username-error');
    const passwordErrorId = generateAriaId('password-error');

    // Function to toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Handle input sanitization and validation
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Sanitize input
        const sanitized = sanitizeTextInput(value);
        setUsername(sanitized);
        
        // Clear error when user types
        if (errors.username) {
            setErrors(prev => ({ ...prev, username: undefined }));
        }
        
        // Validate for script tags
        if (sanitized && !validateNoScriptTags(sanitized)) {
            setErrors(prev => ({ ...prev, username: 'Invalid characters detected' }));
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        
        // Clear error when user types
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: undefined }));
        }
        
        // Validate for script tags
        if (value && !validateNoScriptTags(value)) {
            setErrors(prev => ({ ...prev, password: 'Invalid characters detected' }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // Validate inputs
        const newErrors: { username?: string; password?: string } = {};
        
        if (!username.trim()) {
            newErrors.username = 'Username is required';
        } else if (!validateNoScriptTags(username)) {
            newErrors.username = 'Username contains invalid characters';
        } else if (username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (username.length > 50) {
            newErrors.username = 'Username must be less than 50 characters';
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (!validateNoScriptTags(password)) {
            newErrors.password = 'Password contains invalid characters';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Sanitize before submission
            const sanitizedUsername = sanitizeTextInput(username);
            
            // Here you would typically call your login API
            logger.info('Login attempt', { username: sanitizedUsername });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // On success, redirect or show success message
            logger.info('Login successful');
            
        } catch (error) {
            logger.error('Login failed', error);
            setErrors({ 
                password: 'Invalid username or password. Please try again.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="w-full h-screen flex flex-col items-center justify-center p-2 sm:p-20 bg-cover bg-center"
            style={{ backgroundImage: `url('${backgroundImg}')` }}
            role="main"
        >
            <div className="bg-white/10 backdrop-blur-lg w-full max-w-[800px] p-0 min-h-[500px] flex flex-col md:flex-row gap-4 items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-white/20">
                {/* Left side for text, note or some information */}
                <div className="w-full md:w-[400px] h-[100%] flex items-center justify-center relative">
                    <div className="w-full h-full bg-[#121214a3] absolute z-10 flex flex-col items-center justify-center p-4">
                        <h1 className="text-center text-white text-xl font-bold">School Management System</h1>
                        <p className="text-white text-sm mt-2 text-center">
                            For any problem, you can call: +93 778 778 778
                        </p>
                    </div>
                </div>

                {/* Right form (inputs and button) */}
                <form 
                    className="w-full flex flex-col gap-4 p-4 z-20"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-label="Login form"
                >
                    <div className="text-center mb-4">
                        <h1 className="font-bold text-2xl text-white">WELCOME BACK</h1>
                        <p className="text-sm text-white/80">Sign in to your account</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="username" className="text-white">
                                Username <span className="text-red-300" aria-label="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                onChange={handleUsernameChange}
                                placeholder="مثال: ahmad.ahmadi یا admin"
                                autoComplete="username"
                                aria-required="true"
                                aria-invalid={errors.username ? 'true' : 'false'}
                                aria-describedby={errors.username ? usernameErrorId : undefined}
                                className={`bg-white/20 border ${errors.username ? 'border-red-500' : 'border-white/30'} text-white w-full h-12 p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:border-blue-600 placeholder:text-white/60 transition-all duration-300`}
                                maxLength={50}
                                disabled={isSubmitting}
                            />
                            <FormError error={errors.username} id={usernameErrorId} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="password" className="text-white">
                                Password <span className="text-red-300" aria-label="required">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    placeholder="رمز عبور خود را وارد کنید"
                                    autoComplete="current-password"
                                    aria-required="true"
                                    aria-invalid={errors.password ? 'true' : 'false'}
                                    aria-describedby={errors.password ? passwordErrorId : undefined}
                                    className={`bg-white/20 border ${errors.password ? 'border-red-500' : 'border-white/30'} text-white w-full h-12 p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:border-blue-600 placeholder:text-white/60 transition-all duration-300 pr-12`}
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/80 focus:outline-none focus:ring-2 focus:ring-white rounded"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    disabled={isSubmitting}
                                >
                                    {showPassword ? (
                                        <IoEye className="w-6 h-6" aria-hidden="true" />
                                    ) : (
                                        <IoEyeOff className="w-6 h-6" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                            <FormError error={errors.password} id={passwordErrorId} />
                        </div>
                        <div className='flex flex-row gap-2 pl-1 mb-[-10px] text-white'>
                            <input 
                                type='checkbox' 
                                id='rememberMe'
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isSubmitting}
                            />
                            <label htmlFor='rememberMe'>Remember me</label>
                        </div>
                    </div>

                    <LoadingButton 
                        type="submit"
                        loading={isSubmitting}
                        loadingText="Signing in..."
                        variant="primary"
                        fullWidth
                        className="font-bold py-3 bg-[#232478] text-white mt-3 cursor-pointer rounded-md hover:bg-[#0f1056] hover:shadow-xl transition-all duration-300 flex flex-row items-center gap-1 justify-center"
                        icon={<LuMoveRight aria-hidden="true" />}
                        aria-label="Sign in to your account"
                    >
                        Login
                    </LoadingButton>
                </form>
            </div>
        </div>
    );
}

export default LoginForm;



