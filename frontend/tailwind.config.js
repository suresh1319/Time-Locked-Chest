/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                treasure: {
                    50: '#fef7e7',
                    100: '#fdecc4',
                    200: '#fbd88d',
                    300: '#f9c056',
                    400: '#f7a82e',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
            },
            animation: {
                'chest-idle': 'chest-idle 3s ease-in-out infinite',
                'chest-open': 'chest-open 0.5s ease-out forwards',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                'chest-idle': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                'chest-open': {
                    '0%': { transform: 'rotateX(0deg)' },
                    '100%': { transform: 'rotateX(-30deg)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
            },
        },
    },
    plugins: [],
}
