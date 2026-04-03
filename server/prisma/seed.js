require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const companies = [
  {
    name: 'Mistral Technologies',
    description: 'Vodeća IT firma u Sarajevu specijalizovana za web i mobilni razvoj.',
    industry: 'Informacione tehnologije',
    website: 'https://mistral.ba',
    email: 'hr@mistral.ba',
    phone: '+387 33 123 456',
    city: 'Sarajevo',
    size: 'MEDIUM',
    internships: [
      {
        title: 'Frontend Developer Intern',
        description: 'Rad na React projektima uz mentorstvo senior developera.',
        requirements: 'Osnovno znanje HTML, CSS, JavaScript',
        duration: '3 mjeseca',
        isPaid: true,
        salary: 400,
      }
    ]
  },
  {
    name: 'Atlantbh',
    description: 'Software development kompanija sa dugogodišnjim iskustvom u razvoju enterprise rješenja.',
    industry: 'Informacione tehnologije',
    website: 'https://atlantbh.com',
    email: 'careers@atlantbh.com',
    phone: '+387 33 234 567',
    city: 'Sarajevo',
    size: 'LARGE',
    internships: [
      {
        title: 'Backend Java Intern',
        description: 'Razvoj backend servisa u Java Spring ekosistemu.',
        requirements: 'Poznavanje Java osnova i OOP principa',
        duration: '6 mjeseci',
        isPaid: true,
        salary: 500,
      },
      {
        title: 'QA Engineer Intern',
        description: 'Testiranje softvera i pisanje test case-ova.',
        requirements: 'Poznavanje osnova testiranja',
        duration: '3 mjeseca',
        isPaid: false,
      }
    ]
  },
  {
    name: 'SPARK School',
    description: 'Obrazovna institucija koja nudi programe za mlade u oblasti tehnologije i poduzetništva.',
    industry: 'Obrazovanje',
    website: 'https://spark.ba',
    email: 'info@spark.ba',
    city: 'Sarajevo',
    size: 'SMALL',
    internships: [
      {
        title: 'Education Program Intern',
        description: 'Pomaganje u organizaciji i provedbi obrazovnih programa.',
        requirements: 'Komunikacijske vještine, interes za obrazovanje',
        duration: '2 mjeseca',
        isPaid: false,
      }
    ]
  },
  {
    name: 'Evolent Health',
    description: 'Zdravstvena tehnološka kompanija koja razvija rješenja za upravljanje zdravstvenom zaštitom.',
    industry: 'Zdravstvo & Tehnologija',
    website: 'https://evolenthealth.com',
    email: 'hr.ba@evolenthealth.com',
    city: 'Sarajevo',
    size: 'LARGE',
    internships: [
      {
        title: 'Data Analyst Intern',
        description: 'Analiza zdravstvenih podataka i kreiranje izvještaja.',
        requirements: 'Osnove SQL-a, Excel, interes za analitiku',
        duration: '3 mjeseca',
        isPaid: true,
        salary: 450,
      }
    ]
  },
  {
    name: 'BBI Bank',
    description: 'Prva islamska banka u jugoistočnoj Europi sa sjedištem u Sarajevu.',
    industry: 'Finansije & Bankarstvo',
    website: 'https://bbi.ba',
    email: 'praksa@bbi.ba',
    city: 'Sarajevo',
    size: 'LARGE',
    internships: [
      {
        title: 'Finansijski Analitičar Intern',
        description: 'Analiza finansijskih podataka i podrška timovima.',
        requirements: 'Student ekonomije ili srodnih fakulteta',
        duration: '3 mjeseca',
        isPaid: true,
        salary: 350,
      }
    ]
  },
]

async function main() {
  console.log('Seeding firme...')

  for (const companyData of companies) {
    const { internships, ...data } = companyData

    const company = await prisma.company.create({
      data: {
        ...data,
        internships: {
          create: internships
        }
      }
    })

    console.log(`✓ Kreirana firma: ${company.name}`)
  }

  console.log('Seed završen!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())