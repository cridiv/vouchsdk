import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { DeveloperService } from './developer.service';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiKeyGuard } from './guard/api-key.guard';
import { CurrentDeveloper } from '../common/decorators/current-developer.decorator.js';
import * as client from '@prisma/client';
import * as crypto from 'crypto';

export class ProvisionDeveloperDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    supabaseUid: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    avatarUrl?: string;

    @IsOptional()
    metadata?: any;
}

export class DeveloperSignupDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsOptional()
    name?: string;
}

export class DeveloperLoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class GenerateApiKeyDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;
}

@Controller('developer')
export class DeveloperController {
    constructor(private readonly developerService: DeveloperService) { }

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    async signup(@Body() body: DeveloperSignupDto) {
        const passwordHash = crypto.createHash('sha256').update(body.password).digest('hex');
        const mockSupabaseUid = 'local_' + crypto.randomBytes(16).toString('hex');
        const result = await this.developerService.provision(
            body.email,
            mockSupabaseUid,
            body.name || body.email.split('@')[0],
            undefined,
            { passwordHash },
        );
        return {
            developerId: result.developer.id,
            apiKey: result.apiKey.rawKey,
            developer: result.developer,
        };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: DeveloperLoginDto) {
        const passwordHash = crypto.createHash('sha256').update(body.password).digest('hex');
        
        const developer = await this.developerService.findByEmail(body.email);
        if (!developer) {
            throw new NotFoundException('Invalid email or password.');
        }
        
        const metadata = developer.metadata as any;
        if (!metadata || metadata.passwordHash !== passwordHash) {
            throw new NotFoundException('Invalid email or password.');
        }
        
        const apiKey = await this.developerService.getOrCreateApiKey(developer.id);
        
        return {
            developerId: developer.id,
            apiKey: apiKey.rawKey,
            developer,
        };
    }

    @Post('provision')
    @HttpCode(HttpStatus.OK)
    async provision(@Body() body: ProvisionDeveloperDto) {
        const result = await this.developerService.provision(
            body.email,
            body.supabaseUid,
            body.name,
            body.avatarUrl,
            body.metadata,
        );
        return {
            developerId: result.developer.id,
            apiKey: result.apiKey,
            developer: result.developer,
        };
    }

    @Post('api-keys')
    @UseGuards(ApiKeyGuard)
    @HttpCode(HttpStatus.CREATED)
    async generateApiKey(
        @CurrentDeveloper() developer: client.Developer,
        @Body() body: GenerateApiKeyDto, // Body: { name?: string }
    ) {
        const result = await this.developerService.generateApiKey(
            developer.id,
            body.name,
        );
        return result;
    }

    @Get('stats')
    @UseGuards(ApiKeyGuard)
    @HttpCode(HttpStatus.OK)
    async getStats(
        @CurrentDeveloper() developer: client.Developer,
    ) {
        return this.developerService.getStats(developer.id);
    }

    @Get('logs')
    @UseGuards(ApiKeyGuard)
    @HttpCode(HttpStatus.OK)
    async getLogs(
        @CurrentDeveloper() developer: client.Developer,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
        @Query('eventType') eventType?: string,
    ) {
        return this.developerService.getLogs(
            developer.id,
            limit ? Number(limit) : 50,
            offset ? Number(offset) : 0,
            eventType,
        );
    }

    @Get('logs/:id')
    @UseGuards(ApiKeyGuard)
    @HttpCode(HttpStatus.OK)
    async getLogById(
        @CurrentDeveloper() developer: client.Developer,
        @Param('id') id: string,
    ) {
        const log = await this.developerService.getLogById(id, developer.id);
        if (!log) {
            throw new NotFoundException(`DeveloperLog with ID "${id}" not found.`);
        }
        return log;
    }

    /**
     * DEV/TEST ONLY: Mark a platform user's identity as verified without running the ML pipeline.
     * Useful for testing fraud and escrow flows independently.
     */
    @Post('mark-verified')
    @UseGuards(ApiKeyGuard)
    @HttpCode(HttpStatus.OK)
    async markVerified(
        @CurrentDeveloper() developer: client.Developer,
        @Body() body: { externalUserId: string },
    ) {
        return this.developerService.markUserVerified(body.externalUserId, developer.id);
    }
}
