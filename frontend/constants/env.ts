type TEnv = {
    NEXT_PUBLIC_BASE_URL: string
}

export const ENV: TEnv = {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? 'env-not-set'
}