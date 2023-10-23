import { PrismaClient } from "@prisma/client";
import { injectable, inject } from "inversify";
import 'reflect-metadata';

@injectable()
export class PrismaService {
    client: PrismaClient;

    constructor() {
        this.client = new PrismaClient();
    }

    async connect(): Promise<void> {
        try {
            await this.client.$connect();
            console.log('[PrismaService] Successfully connected to the database')
        } catch (e) {
            if(e instanceof Error) {
                console.log('[PrismaService] Error connecting to database: ' + e.message);
            }
        }
    }
    
    async disconnect(): Promise<void> {
        await this.client.$disconnect();
    }
}