import React, { useState } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { LuMoveRight } from "react-icons/lu";
import { useAuth } from "../../contexts/AuthContext";

// The background image
const backgroundImg =
  "https://applescoop.org/image/wallpapers/ipad/39555922105788908-33106927849764161.jpg";

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState<{
    username: string;
    password: string;
  }>({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError("Please enter both username and password");
      return;
    }
    setIsLoading(true);
    try {
      await login(formData.username, formData.password);
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center p-2 sm:p-20 bg-cover bg-center"
      style={{ backgroundImage: `url('${backgroundImg}')` }}
    >
      <div className="bg-white/10 backdrop-blur-lg w-full max-w-[800px] p-0 min-h-[500px] flex flex-col md:flex-row gap-4 items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-white/20">
        {/* Left side for text, note or some information */}
        <div className="w-full md:w-[400px] h-[100%] flex items-center justify-center relative">
          <div className="w-full h-full bg-[#121214a3] absolute z-10 flex flex-col items-center justify-center p-4">
            <h1 className="text-center text-white text-xl font-bold">
              School Management System
            </h1>
            <p className="text-white text-sm mt-2 text-center">
              For any problem, you can call: +93 778 778 778
            </p>
          </div>
        </div>

        {/* Right form (inputs and button) */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-4 p-4 z-20"
        >
          <div className="text-center mb-4">
            <h1 className="font-bold text-2xl text-white">WELCOME BACK</h1>
            <p className="text-sm text-white/80">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm text-center mb-2">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-white">
                Name
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="@username"
                disabled={isLoading}
                className="bg-white/20 border border-white/30 text-gray-900 w-full h-12 p-4 rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-blue-600 placeholder:text-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-white">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  disabled={isLoading}
                  className="bg-white/20 border border-white/30 text-gray-900 w-full h-12 p-4 rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-blue-600 placeholder:text-gray-500 transition-all duration-300 pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/80"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <IoEye className="w-6 h-6" />
                  ) : (
                    <IoEyeOff className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-row gap-2 pl-1 mb-[-10px] text-white">
              <input
                type="checkbox"
                id="check"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <label htmlFor="check">Remember me</label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="font-bold py-3 bg-[#232478] text-white mt-3 cursor-pointer rounded-md hover:bg-[#0f1056] hover:shadow-xl transition-all duration-300 flex flex-row items-center gap-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#232478]"
          >
            <p>{isLoading ? "Logging in..." : "Login"}</p> <LuMoveRight />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
