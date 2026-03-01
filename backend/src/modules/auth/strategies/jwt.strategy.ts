/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
//next js auth file
//passport is auth middleware
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { PrismaService } from "src/prisma/prisma.service";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService} from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        private prisma: PrismaService, 
        private configService : ConfigService
    )
    {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'), 
        })
    }
    async validate(payload: { sub: string; email: string}){
        const user = await this.prisma.user.findUnique({
            where : {id: payload.sub},
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            }
        })
        if(!user){
            throw new UnauthorizedException('User not found')
        }
        return user;
    }
}
