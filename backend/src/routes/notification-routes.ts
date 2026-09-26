import type { FastifyInstance } from "fastify";

import type { AppContainer } from "../container";

export function registerNotificationRoutes(
  app: FastifyInstance,
  container: AppContainer,
): void {
  app.get(
    "/admin/notifications",
    {
      preHandler: container.authenticationGuard,
      schema: {
        tags: ["Notifications"],
        summary: "Lista as notificações do criador autenticado",
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            type: "object",
            required: ["notifications", "unreadCount"],
            properties: {
              unreadCount: { type: "integer", minimum: 0 },
              notifications: {
                type: "array",
                items: { $ref: "notificationItem#" },
              },
            },
          },
          401: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.notifications.list,
  );

  app.patch(
    "/admin/notifications/read-all",
    {
      preHandler: container.authenticationGuard,
      schema: {
        tags: ["Notifications"],
        summary: "Marca todas as notificações como lidas",
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            type: "object",
            required: ["updatedCount", "readAt"],
            properties: {
              updatedCount: { type: "integer", minimum: 0 },
              readAt: { type: "string", format: "date-time" },
            },
          },
          401: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.notifications.markAllRead,
  );
}
