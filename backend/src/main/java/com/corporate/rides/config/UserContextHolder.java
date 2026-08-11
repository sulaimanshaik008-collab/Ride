package com.corporate.rides.config;

public class UserContextHolder {
    private static final ThreadLocal<UserPrincipal> CONTEXT = new ThreadLocal<>();

    public static void setContext(UserPrincipal userPrincipal) {
        CONTEXT.set(userPrincipal);
    }

    public static UserPrincipal getContext() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
