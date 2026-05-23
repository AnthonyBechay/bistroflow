import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

async function getEmployeeContext(req: AuthRequest) {
  if (!req.subAccountId) return null;

  const sub = await prisma.subAccount.findUnique({
    where: { id: req.subAccountId },
  });
  if (!sub) return null;

  const employee = await prisma.employee.findFirst({
    where: {
      email: sub.email,
      restaurant: { userId: req.userId! },
      isActive: true,
    },
    include: { restaurant: true },
  });
  return employee;
}

router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const employee = await getEmployeeContext(req);
    if (!employee) {
      res.status(404).json({ error: 'No associated employee record found.' });
      return;
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee profile' });
  }
});

router.get('/shifts', async (req: AuthRequest, res) => {
  try {
    const employee = await getEmployeeContext(req);
    if (!employee) {
      res.status(404).json({ error: 'No associated employee record found.' });
      return;
    }
    const shifts = await prisma.shift.findMany({
      where: { employeeId: employee.id },
      include: {
        schedule: {
          include: { restaurant: true },
        },
      },
      orderBy: [
        { schedule: { weekStart: 'desc' } },
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

router.get('/availability', async (req: AuthRequest, res) => {
  try {
    const employee = await getEmployeeContext(req);
    if (!employee) {
      res.status(404).json({ error: 'No associated employee record found.' });
      return;
    }
    const availability = await prisma.availability.findMany({
      where: { employeeId: employee.id },
      orderBy: { dayOfWeek: 'asc' },
    });
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

router.post('/availability', async (req: AuthRequest, res) => {
  try {
    const employee = await getEmployeeContext(req);
    if (!employee) {
      res.status(404).json({ error: 'No associated employee record found.' });
      return;
    }
    const { days } = req.body;
    if (!Array.isArray(days)) {
      res.status(400).json({ error: 'Invalid days array format' });
      return;
    }

    await prisma.$transaction([
      prisma.availability.deleteMany({ where: { employeeId: employee.id } }),
      prisma.availability.createMany({
        data: days.map(d => ({
          employeeId: employee.id,
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          isAvailable: d.isAvailable,
        })),
      }),
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save availability' });
  }
});

router.get('/time-off', async (req: AuthRequest, res) => {
  try {
    const employee = await getEmployeeContext(req);
    if (!employee) {
      res.status(404).json({ error: 'No associated employee record found.' });
      return;
    }
    const requests = await prisma.timeOffRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { startDate: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time-off requests' });
  }
});

router.post('/time-off', async (req: AuthRequest, res) => {
  try {
    const employee = await getEmployeeContext(req);
    if (!employee) {
      res.status(404).json({ error: 'No associated employee record found.' });
      return;
    }
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Start date and end date are required' });
      return;
    }
    const request = await prisma.timeOffRequest.create({
      data: {
        employeeId: employee.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'PENDING',
      },
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit time-off request' });
  }
});

router.get('/swaps', async (req: AuthRequest, res) => {
  try {
    const employee = await getEmployeeContext(req);
    if (!employee) {
      res.status(404).json({ error: 'No associated employee record found.' });
      return;
    }
    const swaps = await prisma.shiftSwap.findMany({
      where: {
        status: 'PENDING',
        requestingEmployee: { restaurantId: employee.restaurantId },
      },
      include: {
        shift: {
          include: { schedule: true },
        },
        requestingEmployee: true,
        targetEmployee: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shift swaps' });
  }
});

router.post('/swaps', async (req: AuthRequest, res) => {
  try {
    const employee = await getEmployeeContext(req);
    if (!employee) {
      res.status(404).json({ error: 'No associated employee record found.' });
      return;
    }
    const { shiftId, targetEmployeeId } = req.body;
    if (!shiftId) {
      res.status(400).json({ error: 'Shift ID is required' });
      return;
    }

    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, employeeId: employee.id },
    });
    if (!shift) {
      res.status(400).json({ error: 'Shift not found or does not belong to you' });
      return;
    }

    const swap = await prisma.shiftSwap.create({
      data: {
        shiftId,
        requestingEmployeeId: employee.id,
        targetEmployeeId: targetEmployeeId || null,
        status: 'PENDING',
      },
    });
    res.status(201).json(swap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shift swap' });
  }
});

router.post('/swaps/:id/claim', async (req: AuthRequest, res) => {
  try {
    const employee = await getEmployeeContext(req);
    if (!employee) {
      res.status(404).json({ error: 'No associated employee record found.' });
      return;
    }

    const swap = await prisma.shiftSwap.findUnique({
      where: { id: req.params.id as string },
      include: { requestingEmployee: true },
    });

    if (!swap || swap.status !== 'PENDING') {
      res.status(400).json({ error: 'Swap request not found or no longer pending' });
      return;
    }

    if (swap.requestingEmployeeId === employee.id) {
      res.status(400).json({ error: 'You cannot claim your own shift' });
      return;
    }

    if (swap.requestingEmployee.restaurantId !== employee.restaurantId) {
      res.status(403).json({ error: 'You can only claim shifts from your own branch' });
      return;
    }

    const updated = await prisma.shiftSwap.update({
      where: { id: swap.id },
      data: {
        status: 'CLAIMED',
        targetEmployeeId: employee.id,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to claim shift swap' });
  }
});

export default router;
