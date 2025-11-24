import type { Prisma } from "@prisma/client";

export type TaskWithUsers = Prisma.TaskGetPayload<{
  include: {
    assignee: true;
    author: true;
    checker: true;
  };
}>;

export type TaskDetail = Prisma.TaskGetPayload<{
  include: {
    assignee: true;
    author: true;
    checker: true;
    workLogs: {
      include: {
        user: true;
      };
      orderBy: {
        workDate: "desc";
      };
    };
  };
}>;

export type ShiftWithUser = Prisma.ShiftGetPayload<{
  include: {
    user: true;
  };
}>;

export type WorkLogWithRelations = Prisma.WorkLogGetPayload<{
  include: {
    user: true;
    task: true;
  };
}>;

