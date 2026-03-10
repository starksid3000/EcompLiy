/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {Throttle} from '@nestjs/throttler';

//strict for auth,payments
export const StrickThrottle = () =>
Throttle({
    default:{
        ttl:1000,
        limit:2,
    }
})

//moderate for orders
export const ModerateThrottle = () =>
    Throttle({
        default:{
            ttl:1000,
            limit:5,
        }
})

//Relaxed rate for read 
export const RelaxedThrottle = () =>
    Throttle({
        default:{
            ttl:1000,
            limit:20,
        }
    })
