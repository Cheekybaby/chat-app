import {create} from "zustand";
import {axiosInstance} from "../lib/axios.js"
import toast from "react-hot-toast";
import {io} from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:7777" : "/";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigninUp: false,
    isSigninIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    
    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({authUser: res.data});

            get().connectSocket();
        } catch(error){
            console.log("Error in checkAuth", error);
            set({authUser: null});
        } finally {
            set({isCheckingAuth: false})
        }
    },

    signup: async (data) => {
        set({isSigninUp: true});
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({authUser: res.data});
            toast.success("Account created successfully");

            get().connectSocket();
        } catch(error){
            toast.error(error.response.data.message);
        } finally {
            set({isSigninUp: false});
        }
    },

    login: async (data) => {
        set({isSigninIn: true});
        try {
            const res = await axiosInstance.post("/auth/signin", data);
            set({authUser: res.data});
            toast.success("Signed In Successfully");

            get().connectSocket();
        } catch(error){
            toast.error(error.response.data.message);
        } finally {
            set({isSigninIn: false});
        }
    },

    signout: async () => {
        try {
            await axiosInstance.post("/auth/signout");
            set({authUser: null});
            toast.success("Signed out successfully");

            get().disconnectSocket();
        } catch(error){
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (data) => {
        set({isUpdatingProfile: true});
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({authUser:res.data});
            toast.success("Profile Updated Successfully");
        }catch(error){
            toast.error(error.response.data.message);
        } finally {
            set({isUpdatingProfile: false});
        }
    },

    connectSocket: () => {
        const {authUser} = get();
        if (!authUser || get().socket?.connected) return ;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        });
        socket.connect();

        socket.on("getOnlineUsers", (userIds) => {
            set({onlineUsers: userIds});
        });

        set({socket: socket});
    },

    disconnectSocket: () => {
        if(get().socket?.connected) get().socket.disconnect();
    },
}));