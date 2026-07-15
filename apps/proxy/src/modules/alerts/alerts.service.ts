import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { AlertSeverity } from '@aura/shared';

export interface CreateAlertDto {
  projectId: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private readonly transporter: nodemailer.Transporter | null = null;
  private readonly recentAlerts = new Map<string, number>(); // key -> last created timestamp
  private readonly DEDUP_WINDOW_MS = 60_000; // 1 minute

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        auth: { user: smtpUser, pass: smtpPassword },
      });
      this.logger.log('SMTP Transporter initialized successfully.');
    } else {
      this.logger.warn('SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD. Email notifications are disabled.');
    }
  }

  private isDuplicate(dto: CreateAlertDto): boolean {
    const dedupKey = `${dto.projectId}:${dto.title}`;
    const lastSeen = this.recentAlerts.get(dedupKey);
    if (lastSeen && Date.now() - lastSeen < this.DEDUP_WINDOW_MS) {
      return true;
    }
    this.recentAlerts.set(dedupKey, Date.now());
    // Prevent unbounded growth
    if (this.recentAlerts.size > 2000) {
      const firstKey = this.recentAlerts.keys().next().value;
      if (firstKey) this.recentAlerts.delete(firstKey);
    }
    return false;
  }

  async createAlert(dto: CreateAlertDto) {
    if (this.isDuplicate(dto)) {
      this.logger.debug(`Skipping duplicate alert: ${dto.title} for project ${dto.projectId}`);
      return;
    }

    try {
      // 1. Save alert to database
      const alert = await this.prisma.client.alert.create({
        data: {
          projectId: dto.projectId,
          severity: dto.severity,
          status: 'active',
          title: dto.title,
          description: dto.description,
          source: dto.source,
          metadata: dto.metadata || {},
        },
      });

      this.logger.log(`Created [${dto.severity}] alert for project ${dto.projectId}: ${dto.title}`);

      // 2. Dispatch email if severity is critical and transporter is available
      if (dto.severity === 'critical' && this.transporter) {
        this.dispatchCriticalEmail(dto).catch(e => 
          this.logger.error(`Failed to dispatch critical alert email: ${e.message}`)
        );
      }

      return alert;
    } catch (err: any) {
      this.logger.error(`Failed to create alert: ${err.message}`);
    }
  }

  private async dispatchCriticalEmail(dto: CreateAlertDto): Promise<void> {
    const project = await this.prisma.client.project.findUnique({
      where: { id: dto.projectId },
      select: { name: true, tenant: { select: { email: true } } },
    });

    if (!project?.tenant?.email) return;

    await this.sendCriticalAlertEmail(project.tenant.email, dto, project.name);
  }

  private async sendCriticalAlertEmail(to: string, dto: CreateAlertDto, projectName: string) {
    try {
      const info = await this.transporter!.sendMail({
        from: `"Aura Proxy Alerts" <${process.env.SMTP_USER}>`,
        to,
        subject: `[CRITICAL] Aura Proxy Alert: ${projectName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #ef4444; margin-top: 0;">Critical Alert Triggered</h2>
            <p><strong>Project:</strong> ${projectName}</p>
            <p><strong>Title:</strong> ${dto.title}</p>
            <p><strong>Source:</strong> ${dto.source}</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p><strong>Description:</strong></p>
            <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
              <code style="color: #1f2937;">${dto.description}</code>
            </div>
            ${dto.metadata ? `
              <p><strong>Metadata:</strong></p>
              <pre style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto;"><code style="color: #1f2937;">${JSON.stringify(dto.metadata, null, 2)}</code></pre>
            ` : ''}
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">Log into your Aura Proxy dashboard to review and resolve this alert.</p>
          </div>
        `,
      });
      this.logger.log(`Email dispatched successfully to ${to} (Message ID: ${info.messageId})`);
    } catch (err: any) {
      this.logger.error(`Failed to dispatch critical alert email to ${to}: ${err.message}`);
    }
  }
}
