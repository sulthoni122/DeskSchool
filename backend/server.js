const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize Express
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Database file path
const dbPath = path.join(__dirname, '../database/sekolah.json');

// Create database directory if not exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
function initDB() {
    if (!fs.existsSync(dbPath)) {
        const initialData = {
            students: [],
            attendance: [],
            grades: []
        };
        fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    }
}

// Read database
function readDB() {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { students: [], attendance: [], grades: [] };
    }
}

// Write database
function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

initDB();

// ==================== STUDENTS API ====================

// Get all students
app.get('/api/students', (req, res) => {
    try {
        const db = readDB();
        const search = req.query.q || '';
        let students = db.students;
        
        if (search) {
            const s = search.toLowerCase();
            students = students.filter(s => 
                s.name.toLowerCase().includes(s) ||
                s.nis.toLowerCase().includes(s) ||
                s.class.toLowerCase().includes(s)
            );
        }
        
        students.sort((a, b) => a.name.localeCompare(b.name));
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student by ID
app.get('/api/students/:id', (req, res) => {
    try {
        const db = readDB();
        const student = db.students.find(s => s.id === parseInt(req.params.id));
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create student
app.post('/api/students', (req, res) => {
    try {
        const { name, nis, class: studentClass, gender, parent_phone, notes } = req.body;
        
        if (!name || !nis || !studentClass || !gender) {
            return res.status(400).json({ error: 'Name, NIS, class, and gender are required' });
        }

        const db = readDB();
        
        // Check for duplicate NIS
        if (db.students.some(s => s.nis === nis)) {
            return res.status(400).json({ error: 'NIS already exists' });
        }

        const newStudent = {
            id: Date.now(),
            name,
            nis,
            class: studentClass,
            gender,
            parent_phone: parent_phone || '',
            notes: notes || '',
            created_at: new Date().toISOString()
        };
        
        db.students.push(newStudent);
        writeDB(db);
        
        res.status(201).json(newStudent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update student
app.put('/api/students/:id', (req, res) => {
    try {
        const db = readDB();
        const index = db.students.findIndex(s => s.id === parseInt(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const { name, nis, class: studentClass, gender, parent_phone, notes } = req.body;
        const existing = db.students[index];
        
        // Check for duplicate NIS (excluding current student)
        if (nis && nis !== existing.nis && db.students.some(s => s.nis === nis)) {
            return res.status(400).json({ error: 'NIS already exists' });
        }

        db.students[index] = {
            ...existing,
            name: name || existing.name,
            nis: nis || existing.nis,
            class: studentClass || existing.class,
            gender: gender || existing.gender,
            parent_phone: parent_phone !== undefined ? parent_phone : existing.parent_phone,
            notes: notes !== undefined ? notes : existing.notes
        };
        
        writeDB(db);
        res.json(db.students[index]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
    try {
        const db = readDB();
        const index = db.students.findIndex(s => s.id === parseInt(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const id = parseInt(req.params.id);
        db.students = db.students.filter(s => s.id !== id);
        db.attendance = db.attendance.filter(a => a.student_id !== id);
        db.grades = db.grades.filter(g => g.student_id !== id);
        
        writeDB(db);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== ATTENDANCE API ====================

// Get all attendance
app.get('/api/attendance', (req, res) => {
    try {
        const db = readDB();
        const { meeting } = req.query;
        
        let attendance = db.attendance.map(a => {
            const student = db.students.find(s => s.id === a.student_id);
            return {
                ...a,
                student_name: student ? student.name : 'Unknown',
                nis: student ? student.nis : '',
                class: student ? student.class : ''
            };
        });
        
        if (meeting) {
            attendance = attendance.filter(a => a.meeting === parseInt(meeting));
            attendance.sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''));
        } else {
            attendance.sort((a, b) => b.meeting - a.meeting || (a.student_name || '').localeCompare(b.student_name || ''));
        }
        
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Record attendance
app.post('/api/attendance', (req, res) => {
    try {
        const { student_id, date, meeting, status } = req.body;
        
        if (!student_id || !date || meeting === undefined || !status) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const db = readDB();
        
        // Check if attendance already exists
        const existingIndex = db.attendance.findIndex(
            a => a.student_id === parseInt(student_id) && a.date === date && a.meeting === parseInt(meeting)
        );

        if (existingIndex !== -1) {
            // Update existing
            db.attendance[existingIndex].status = status;
        } else {
            // Insert new
            db.attendance.push({
                id: Date.now(),
                student_id: parseInt(student_id),
                date,
                meeting: parseInt(meeting),
                status
            });
        }
        
        writeDB(db);
        res.status(201).json({ message: 'Attendance recorded successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get attendance stats
app.get('/api/attendance/stats', (req, res) => {
    try {
        const db = readDB();
        
        // Group by meeting
        const meetings = {};
        db.attendance.forEach(a => {
            if (!meetings[a.meeting]) {
                meetings[a.meeting] = { meeting: a.meeting, hadir: 0, sakit: 0, izin: 0, alpha: 0 };
            }
            if (a.status === 'H') meetings[a.meeting].hadir++;
            else if (a.status === 'S') meetings[a.meeting].sakit++;
            else if (a.status === 'I') meetings[a.meeting].izin++;
            else if (a.status === 'A') meetings[a.meeting].alpha++;
        });
        
        const stats = Object.values(meetings).sort((a, b) => a.meeting - b.meeting);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== GRADES API ====================

// Get all grades
app.get('/api/grades', (req, res) => {
    try {
        const db = readDB();
        const { student_id } = req.query;
        
        let grades = db.grades.map(g => {
            const student = db.students.find(s => s.id === g.student_id);
            return {
                ...g,
                student_name: student ? student.name : 'Unknown',
                nis: student ? student.nis : '',
                class: student ? student.class : ''
            };
        });
        
        if (student_id) {
            grades = grades.filter(g => g.student_id === parseInt(student_id));
            grades.sort((a, b) => a.type.localeCompare(b.type));
        } else {
            grades.sort((a, b) => (a.student_name || '').localeCompare(b.student_name || '') || a.type.localeCompare(b.type));
        }
        
        res.json(grades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create grade
app.post('/api/grades', (req, res) => {
    try {
        const { student_id, type, score } = req.body;
        
        if (!student_id || !type || score === undefined) {
            return res.status(400).json({ error: 'Student ID, type, and score are required' });
        }

        const db = readDB();
        
        // Check if grade already exists for this student and type
        const existingIndex = db.grades.findIndex(
            g => g.student_id === parseInt(student_id) && g.type === type
        );

        if (existingIndex !== -1) {
            // Update existing
            db.grades[existingIndex].score = score;
        } else {
            // Insert new
            db.grades.push({
                id: Date.now(),
                student_id: parseInt(student_id),
                type,
                score,
                created_at: new Date().toISOString()
            });
        }
        
        writeDB(db);
        res.status(201).json({ message: 'Grade saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update grade
app.put('/api/grades/:id', (req, res) => {
    try {
        const db = readDB();
        const index = db.grades.findIndex(g => g.id === parseInt(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({ error: 'Grade not found' });
        }

        const { score } = req.body;
        db.grades[index].score = score;
        
        writeDB(db);
        res.json({ message: 'Grade updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete grade
app.delete('/api/grades/:id', (req, res) => {
    try {
        const db = readDB();
        const index = db.grades.findIndex(g => g.id === parseInt(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({ error: 'Grade not found' });
        }

        db.grades.splice(index, 1);
        writeDB(db);
        res.json({ message: 'Grade deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DASHBOARD API ====================

// Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
    try {
        const db = readDB();
        
        // Total students
        const totalStudents = db.students.length;
        
        // Total classes
        const classes = [...new Set(db.students.map(s => s.class))];
        const totalClasses = classes.filter(c => c).length;
        
        // Calculate class average
        let classAverage = 0;
        if (db.grades.length > 0) {
            const sum = db.grades.reduce((acc, g) => acc + g.score, 0);
            classAverage = (sum / db.grades.length).toFixed(2);
        }
        
        // Students needing remedial (average < 70)
        const studentGrades = {};
        db.grades.forEach(g => {
            if (!studentGrades[g.student_id]) {
                studentGrades[g.student_id] = [];
            }
            if (g.type === 'uts' || g.type === 'uas') {
                studentGrades[g.student_id].push(g.score);
            }
        });
        
        let remedialCount = 0;
        Object.values(studentGrades).forEach(scores => {
            if (scores.length > 0) {
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                if (avg < 70) remedialCount++;
            }
        });
        
        res.json({
            totalStudents,
            totalClasses,
            classAverage: parseFloat(classAverage),
            remedialStudents: remedialCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== REPORTS API ====================

// Get grade recap with ranking
app.get('/api/report/grades', (req, res) => {
    try {
        const db = readDB();
        
        const recap = db.students.map(student => {
            const grades = db.grades.filter(g => g.student_id === student.id);
            
            // Calculate assignment average
            const assignments = grades.filter(g => g.type === 'assignment');
            const assignmentAvg = assignments.length > 0 
                ? assignments.reduce((sum, g) => sum + g.score, 0) / assignments.length 
                : 0;
            
            const quiz = grades.find(g => g.type === 'quiz');
            const quizScore = quiz ? quiz.score : 0;
            
            const uts = grades.find(g => g.type === 'uts');
            const utsScore = uts ? uts.score : 0;
            
            const uas = grades.find(g => g.type === 'uas');
            let uasScore = uas ? uas.score : 0;
            
            const remedial = grades.find(g => g.type === 'remedial');
            if (remedial && remedial.score > uasScore) {
                uasScore = remedial.score;
            }
            
            // Calculate final grade
            // formula: (assignment * 40%) + (UTS * 30%) + (UAS * 30%)
            const finalGrade = (assignmentAvg * 0.4) + (utsScore * 0.3) + (uasScore * 0.3);
            
            return {
                id: student.id,
                name: student.name,
                nis: student.nis,
                class: student.class,
                assignment_avg: assignmentAvg.toFixed(2),
                quiz: quizScore,
                uts: utsScore,
                uas: uasScore,
                remedial: remedial ? remedial.score : null,
                final_grade: finalGrade.toFixed(2)
            };
        });
        
        // Sort by final grade descending
        recap.sort((a, b) => parseFloat(b.final_grade) - parseFloat(a.final_grade));
        
        // Add rank
        recap.forEach((r, index) => {
            r.rank = index + 1;
        });
        
        res.json(recap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get attendance report
app.get('/api/report/attendance', (req, res) => {
    try {
        const db = readDB();
        const { startDate, endDate } = req.query;
        
        let attendance = db.attendance.map(a => {
            const student = db.students.find(s => s.id === a.student_id);
            return {
                ...a,
                student_name: student ? student.name : 'Unknown',
                nis: student ? student.nis : '',
                class: student ? student.class : ''
            };
        });
        
        if (startDate && endDate) {
            attendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
        }
        
        attendance.sort((a, b) => b.date.localeCompare(a.date) || b.meeting - a.meeting || (a.student_name || '').localeCompare(b.student_name || ''));
        
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`GuruDesk server running at http://localhost:${PORT}`);
    console.log(`Database: ${dbPath}`);
});

