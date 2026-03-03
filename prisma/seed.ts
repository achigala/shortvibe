import prisma from "../lib/prisma"
import { hash } from "bcryptjs"

async function main() {
  const hashedPassword = await hash("admin123", 12)

  // === 4 TEAM MEMBERS ===
  const boss = await prisma.user.upsert({
    where: { email: "boss@shortvibe.com" },
    update: { name: "เอิ้น (Boss)", nickname: "เอิ้น", phone: "089-111-1111", position: "เจ้าของ/ผู้บริหาร", bio: "เจ้าของ Shortvibe ดูแลงาน และรับผิดชอบทุกอย่าง", skills: "Management,Strategy,Creative Direction,Sales", themeColor: "purple", isApproved: true },
    create: { name: "เอิ้น (Boss)", email: "boss@shortvibe.com", password: hashedPassword, role: "BOSS", isApproved: true, nickname: "เอิ้น", phone: "089-111-1111", position: "เจ้าของ/ผู้บริหาร", bio: "เจ้าของ Shortvibe ดูแลงาน และรับผิดชอบทุกอย่าง", skills: "Management,Strategy,Creative Direction,Sales", themeColor: "purple" },
  })

  const developer = await prisma.user.upsert({
    where: { email: "dev@shortvibe.com" },
    update: { name: "เอย (Developer)", nickname: "เอย", phone: "089-222-2222", position: "นักพัฒนาระบบ/เขียนบท", bio: "ดูแลระบบ Shortvibe ทุกอย่าง", skills: "Content Writing,SEO,Copywriting,Web Development", themeColor: "blue", isApproved: true },
    create: { name: "เอย (Developer)", email: "dev@shortvibe.com", password: hashedPassword, role: "DEVELOPER", isApproved: true, nickname: "เอย", phone: "089-222-2222", position: "นักพัฒนาระบบ/เขียนบท", bio: "ดูแลระบบ Shortvibe ทุกอย่าง", skills: "Content Writing,SEO,Copywriting,Web Development", themeColor: "blue" },
  })

  const meow = await prisma.user.upsert({
    where: { email: "meow@shortvibe.com" },
    update: { name: "เหมย (Staff)", nickname: "เหมย", phone: "089-333-3333", position: "ตัดต่อวิดีโอ/กราฟิก", bio: "รับผิดชอบตัดต่อวิดีโอและออกแบบกราฟิก", skills: "Video Editing,Motion Graphics,Photoshop,Premiere Pro", themeColor: "pink", isApproved: true },
    create: { name: "เหมย (Staff)", email: "meow@shortvibe.com", password: hashedPassword, role: "STAFF", isApproved: true, nickname: "เหมย", phone: "089-333-3333", position: "ตัดต่อวิดีโอ/กราฟิก", bio: "รับผิดชอบตัดต่อวิดีโอและออกแบบกราฟิก", skills: "Video Editing,Motion Graphics,Photoshop,Premiere Pro", themeColor: "pink" },
  })

  const ryu = await prisma.user.upsert({
    where: { email: "ryu@shortvibe.com" },
    update: { name: "น้องริว (Staff)", nickname: "น้องริว", phone: "089-444-4444", position: "ถ่ายวิดีโอ/ช่างภาพ", bio: "รับผิดชอบถ่ายวิดีโอและถ่ายภาพ", skills: "Videography,Photography,Lighting,Drone", themeColor: "green", isApproved: true },
    create: { name: "น้องริว (Staff)", email: "ryu@shortvibe.com", password: hashedPassword, role: "STAFF", isApproved: true, nickname: "น้องริว", phone: "089-444-4444", position: "ถ่ายวิดีโอ/ช่างภาพ", bio: "รับผิดชอบถ่ายวิดีโอและถ่ายภาพ", skills: "Videography,Photography,Lighting,Drone", themeColor: "green" },
  })

  // Remove old staff@shortvibe.com if exists
  await prisma.user.deleteMany({ where: { email: "staff@shortvibe.com" } }).catch(() => {})

  const allUsers = [boss, developer, meow, ryu]

  // === STATUSES ===
  const statuses = [
    { category: "PROJECT_STATUS", name: "รอดำเนินการ", order: 1 },
    { category: "PROJECT_STATUS", name: "กำลังดำเนินการ", order: 2 },
    { category: "PROJECT_STATUS", name: "รอตรวจสอบ", order: 3 },
    { category: "PROJECT_STATUS", name: "เสร็จสิ้น", order: 4 },
    { category: "TASK_STATUS", name: "ยังไม่เริ่ม", order: 1 },
    { category: "TASK_STATUS", name: "กำลังทำ", order: 2 },
    { category: "TASK_STATUS", name: "รอตรวจ", order: 3 },
    { category: "TASK_STATUS", name: "เสร็จ", order: 4 },
  ]

  for (const status of statuses) {
    await prisma.masterData.upsert({
      where: { id: status.category + "-" + status.order },
      update: {},
      create: { id: status.category + "-" + status.order, category: status.category, name: status.name, order: status.order },
    })
  }

  const activeStatusId = "PROJECT_STATUS-2"
  const doneStatusId = "PROJECT_STATUS-4"

  // === REAL CLIENT DATA from วิเคราะห์ยอดขาย.xlsx ===
  const clientsData = [
    {
      name: "บริษัท สแมช เลชชัวร์ จำกัด", businessType: "สถานออกกำลังกายและสนามกีฬา", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "แพ็คเกจ 5 คลิป", amount: 12900, confirmed: true, date: "2026-01-07" },
      ]
    },
    {
      name: "บริษัท ซีจี ไซแอนติฟิค จำกัด", businessType: "เครื่องมือวิทยาศาสตร์", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "พนักงาน",
      projects: [
        { product: "ทดลอง 2 คลิป", amount: 5500, confirmed: true, date: "2026-01-07" },
      ]
    },
    {
      name: "Perfect Cup", businessType: "ธุรกิจค้าขาย + ขายส่ง", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "แพ็คเกจ 10 คลิป (คุณแพรว)", amount: 19900, confirmed: false, date: "2026-01-07" },
        { product: "แพ็คเกจ 10 คลิป (ต่อสัญญา)", amount: 19000, confirmed: true, date: "2026-01-27" },
      ]
    },
    {
      name: "Beari", businessType: "ธุรกิจค้าขาย", channel: "Fastwork", customerType: "ลูกค้าเก่า", contactGroup: "พนักงาน",
      projects: [
        { product: "แพ็คเกจ 10 คลิป (เดือนก่อน)", amount: 15000, confirmed: true, date: "2026-01-08" },
        { product: "แพ็คเกจ 10 คลิป (ต่อสัญญา)", amount: 15000, confirmed: true, date: "2026-02-01" },
      ]
    },
    {
      name: "priorluxe", businessType: "ธุรกิจค้าขาย", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "แพ็คเกจ 10 คลิป", amount: 19900, confirmed: false, date: "2026-01-11" },
      ]
    },
    {
      name: "Xinet Thailand", businessType: "ธุรกิจค้าขาย + ขายส่ง", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "แพ็คเกจ 2 คลิป (ทดลอง)", amount: 4000, confirmed: true, date: "2026-01-12" },
        { product: "แพ็คเกจ 5 คลิป (ต่อยอด)", amount: 4000, confirmed: true, date: "2026-02-05" },
      ]
    },
    {
      name: "Coffee Chillver (คอฟฟี่ชิวเวอร์)", businessType: "ร้านกาแฟ + ธุรกิจ OEM", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "พนักงาน",
      projects: [
        { product: "แพ็คเกจ 2 คลิป (ทดลอง)", amount: 5990, confirmed: true, date: "2026-01-14" },
        { product: "แพ็คเกจ 5 คลิป (ต่อยอด)", amount: 5000, confirmed: true, date: "2026-02-03" },
      ]
    },
    {
      name: "Silom Complex", businessType: "ห้างสรรพสินค้า", channel: "Line", customerType: "ลูกค้าเก่า", contactGroup: "พนักงาน",
      projects: [
        { product: "แพ็คเกจ 10 คลิป (ต่อสัญญา)", amount: 25000, confirmed: true, date: "2026-01-15" },
      ]
    },
    {
      name: "Dow Guru", businessType: "ธุรกิจในเครือ SCG", channel: "Line", customerType: "ลูกค้าเก่า", contactGroup: "พนักงาน",
      projects: [
        { product: "แพ็คเกจ 10 คลิป (ต่อสัญญา)", amount: 16000, confirmed: true, date: "2026-01-15" },
      ]
    },
    {
      name: "memmoread.website", businessType: "ธุรกิจด้านการเรียน", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "แพ็คเกจ 5 คลิป", amount: 14900, confirmed: true, date: "2026-01-17" },
      ]
    },
    {
      name: "แอพยืมคล่อง", businessType: "ธุรกิจกู้ยืมเงิน", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "พนักงาน",
      projects: [
        { product: "แพ็คเกจ 15 คลิป", amount: 44000, confirmed: true, date: "2026-01-21" },
      ]
    },
    {
      name: "ร้านอาหาร Cao cao (คุณอ้วน)", businessType: "ธุรกิจร้านอาหาร", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "ทดลอง 2 คลิป", amount: 5000, confirmed: true, date: "2026-01-23" },
      ]
    },
    {
      name: "ร้านหมี่ไก่ฉีก (Fu mian)", businessType: "ธุรกิจร้านอาหาร", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "แพ็คเกจ 10 คลิป", amount: 19900, confirmed: true, date: "2026-01-25" },
        { product: "แพ็คเกจ 10 คลิป (ต่อสัญญา)", amount: 19000, confirmed: true, date: "2026-02-10" },
      ]
    },
    {
      name: "BK8 Entertainment", businessType: "ธุรกิจสื่อออนไลน์", channel: "Line", customerType: "ลูกค้าเก่า", contactGroup: "พนักงาน",
      projects: [
        { product: "แพ็คเกจ 30 คลิป (ต่อเนื่อง)", amount: 25000, confirmed: true, date: "2026-01-28" },
      ]
    },
    {
      name: "โรงแรม", businessType: "ธุรกิจที่พัก", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "พนักงาน",
      projects: [
        { product: "ทดลอง 2 คลิป", amount: 5900, confirmed: true, date: "2026-01-28" },
        { product: "แพ็คเกจ 5 คลิป (ต่อยอด)", amount: 5000, confirmed: true, date: "2026-02-08" },
      ]
    },
    {
      name: "Japan Fastship", businessType: "ธุรกิจค้าขาย", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "แพ็คเกจ 10 คลิป", amount: 15000, confirmed: true, date: "2026-02-02" },
        { product: "แพ็คเกจ 10 คลิป (ต่อสัญญา)", amount: 15000, confirmed: true, date: "2026-02-15" },
      ]
    },
    {
      name: "JK2", businessType: "ธุรกิจค้าขาย", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "แพ็คเกจ 10 คลิป", amount: 25000, confirmed: true, date: "2026-02-04" },
        { product: "แพ็คเกจ 15 คลิป (ต่อสัญญา)", amount: 25000, confirmed: true, date: "2026-02-18" },
      ]
    },
    {
      name: "ขนมนูกัต", businessType: "ธุรกิจค้าขาย", channel: "Fastwork", customerType: "ลูกค้าใหม่", contactGroup: "เจ้าของบริษัท",
      projects: [
        { product: "ทดลอง 2 คลิป", amount: 5000, confirmed: true, date: "2026-02-06" },
        { product: "แพ็คเกจ 5 คลิป (ต่อยอด)", amount: 5000, confirmed: true, date: "2026-02-20" },
      ]
    },
    {
      name: "บริษัท มีดี โปรดัคชั่น จำกัด", businessType: "สื่อโฆษณาและโปรดักชั่น", channel: "Line", customerType: "ลูกค้าใหม่", contactGroup: "พนักงาน",
      projects: [
        { product: "แพ็คเกจ 5 คลิป", amount: 9500, confirmed: true, date: "2026-02-12" },
      ]
    },
  ]

  // Task templates per project type
  const taskTemplates = [
    { name: "คิดคอนเทนต์", desc: "วางแผนเนื้อหาและคอนเทนต์สำหรับคลิป" },
    { name: "ถ่ายวิดีโอ", desc: "ถ่ายทำวิดีโอตามบรีฟ" },
    { name: "ตัดต่อวิดีโอ", desc: "ตัดต่อและใส่เอฟเฟกต์" },
    { name: "ทำกราฟิก/ปก", desc: "ออกแบบกราฟิกและปกวิดีโอ" },
    { name: "ส่งตรวจลูกค้า", desc: "ส่งงานให้ลูกค้าตรวจสอบ" },
  ]

  // Create clients + projects + revenue + tasks
  const owners = [boss, developer, meow, ryu]
  let projectIndex = 0

  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: {
        name: clientData.name,
        businessType: clientData.businessType,
        contactName: clientData.contactGroup === "เจ้าของบริษัท" ? "เจ้าของกิจการ" : "พนักงาน",
      },
    })

    for (const proj of clientData.projects) {
      const startDate = new Date(proj.date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 30)

      const isComplete = proj.confirmed && startDate < new Date("2026-02-01")
      const owner = owners[projectIndex % owners.length]

      const project = await prisma.project.create({
        data: {
          name: proj.product,
          clientId: client.id,
          ownerId: owner.id,
          statusId: isComplete ? doneStatusId : activeStatusId,
          isCompleted: isComplete,
          startDate: startDate,
          endDate: endDate,
        },
      })

      // Add project members (owner + 1-2 others)
      const memberIds = new Set<string>([owner.id])
      memberIds.add(allUsers[(projectIndex + 1) % allUsers.length].id)
      if (projectIndex % 3 === 0) {
        memberIds.add(allUsers[(projectIndex + 2) % allUsers.length].id)
      }

      for (const userId of memberIds) {
        await prisma.projectMember.create({
          data: { projectId: project.id, userId },
        })
      }

      // Create tasks for each project
      const numTasks = isComplete ? taskTemplates.length : Math.min(3, taskTemplates.length)
      for (let t = 0; t < numTasks; t++) {
        const tmpl = taskTemplates[t]
        const taskDone = isComplete || t < 1
        const taskStatusId = taskDone ? "TASK_STATUS-4" : (t < 2 ? "TASK_STATUS-2" : "TASK_STATUS-1")

        const taskDueDate = new Date(startDate)
        taskDueDate.setDate(taskDueDate.getDate() + (t + 1) * 5)

        // Boss or Developer created the task
        const creatorId = projectIndex % 2 === 0 ? boss.id : developer.id

        // Assign to staff members based on task type
        let assigneeIds: string[] = []
        if (tmpl.name.includes("ถ่าย")) {
          assigneeIds = [ryu.id]
        } else if (tmpl.name.includes("ตัดต่อ") || tmpl.name.includes("กราฟิก")) {
          assigneeIds = [meow.id]
        } else if (tmpl.name.includes("คอนเทนต์")) {
          assigneeIds = [developer.id, meow.id]
        } else {
          assigneeIds = [owner.id]
        }

        const task = await prisma.task.create({
          data: {
            projectId: project.id,
            name: tmpl.name,
            description: tmpl.desc,
            statusId: taskStatusId,
            createdById: creatorId,
            dueDate: taskDueDate,
            isClosed: taskDone,
            closedAt: taskDone ? new Date(taskDueDate.getTime() - 86400000) : null,
          },
        })

        // Assign task to users
        for (const assigneeId of assigneeIds) {
          await prisma.taskAssignee.create({
            data: { taskId: task.id, userId: assigneeId },
          })
        }

        // Add a comment on some tasks
        if (t === 0 && projectIndex % 3 === 0) {
          await prisma.taskComment.create({
            data: {
              taskId: task.id,
              userId: boss.id,
              content: "ดูดีแล้วค่ะ ผ่าน!",
            },
          })
        }
      }

      // Revenue
      if (proj.confirmed && proj.amount > 0) {
        await prisma.revenue.create({
          data: {
            amount: proj.amount,
            description: proj.product + " - " + clientData.name,
            clientId: client.id,
            date: startDate,
            type: clientData.channel,
            isConfirmed: true,
          },
        })
      }

      projectIndex++
    }
  }

  console.log("✅ Seed completed!")
  console.log("")
  console.log("👤 ทีมงาน 4 คน (password: admin123):")
  console.log("   1. เอิ้น (Boss)      → boss@shortvibe.com")
  console.log("   2. เลย (Developer)   → dev@shortvibe.com")
  console.log("   3. เหมย (Staff)      → meow@shortvibe.com")
  console.log("   4. น้องริว (Staff)    → ryu@shortvibe.com")
  console.log("")
  console.log("📊 Clients:", clientsData.length)
  console.log("📁 Projects:", clientsData.reduce((sum, c) => sum + c.projects.length, 0))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
