package com.ecommerce.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Mirrors NestJS main.ts DocumentBuilder setup:
 *
 *   .setTitle('API DOCUMENTATION')
 *   .setDescription('API documentation for the application')
 *   .setVersion('1.0')
 *   .addBearerAuth({ name: 'JWT-auth' })       → security scheme 'JWT-auth'
 *   .addBearerAuth({ name: 'JWT-refresh' })    → security scheme 'JWT-refresh'
 *   .addServer('http://localhost:3000')
 *
 * Swagger UI available at: http://localhost:8080/api/docs
 */
@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API DOCUMENTATION")
                        .description("API documentation for the application")
                        .version("1.0"))

                .addServersItem(new Server()
                        .url("http://localhost:8080")
                        .description("Development server"))

                // ADD THESE TWO — applies JWT-auth globally to all endpoints
                .addSecurityItem(new SecurityRequirement().addList("JWT-auth"))
                .addSecurityItem(new SecurityRequirement().addList("JWT-refresh"))

                .components(new Components()
                        .addSecuritySchemes("JWT-auth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .name("JWT")
                                .description("Enter JWT access token")
                                .in(SecurityScheme.In.HEADER))
                        .addSecuritySchemes("JWT-refresh", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .name("Refresh-JWT")
                                .description("Enter JWT refresh token")
                                .in(SecurityScheme.In.HEADER)));
    }
}