import { calculateLeaderboard } from '../src/lib/studentModel.js';

const mockStudents = [
  { id: '1', name: 'Alice', status: 'active', category: 'Sub-12' },
  { id: '2', name: 'Bob', status: 'active', category: 'Sub-12' },
  { id: '3', name: 'Charlie', status: 'suspended', category: 'Sub-10' },
];

const mockEvaluations = [
  { studentName: 'Alice', metrics: { speed: 8, passing: 9, dribbling: 7, shooting: 8, physical: 9, discipline: 10 } },
  { studentName: 'Alice', metrics: { speed: 9, passing: 9, dribbling: 8, shooting: 9, physical: 9, discipline: 10 } },
  { studentName: 'Bob', metrics: { speed: 6, passing: 6, dribbling: 6, shooting: 6, physical: 6, discipline: 6 } }
];

const mockAttendance = [
  {
    date: '2023-10-01',
    records: [
      { name: 'Alice', status: 'P' },
      { name: 'Bob', status: 'A' },
      { name: 'Charlie', status: 'P' }
    ]
  },
  {
    date: '2023-10-02',
    records: [
      { name: 'Alice', status: 'J' },
      { name: 'Bob', status: 'P' }
    ]
  }
];

console.log(JSON.stringify(calculateLeaderboard(mockStudents, mockEvaluations, mockAttendance), null, 2));
