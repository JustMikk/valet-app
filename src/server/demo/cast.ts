// The demo's people and places (illustrative data, not real people). Names come from the design
// export and the admin mock; ids are stable so sessions survive a reset.

export const TZ = "America/Los_Angeles"

/** People keep their ids across resets, so a browser's session survives reseeding the demo. */
export const stableId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`

export const TENANT_ID = stableId(1)
export const ADMIN_ID = stableId(50)

export type Person = {
  name: string
  email?: string
  phone?: string
  pushOff?: boolean
  inactive?: boolean
  invited?: boolean
  device?: string
}

// Order is the id: index 0 is stableId(100).
const PEOPLE: Person[] = [
  {
    name: "Jordan Ellis",
    email: "jordan.ellis@gmail.com",
    phone: "(415) 555-0123",
    device: "iPhone",
  },
  { name: "Maya Patel", email: "maya.p@gmail.com" },
  { name: "Devon Kim" },
  { name: "Luis Torres", email: "ltorres@outlook.com" },
  { name: "Ari Brooks", email: "ari.b@gmail.com", pushOff: true },
  { name: "Sam Rivera", email: "sam.rivera@icloud.com" },
  { name: "Kai Morgan", email: "kai.morgan@gmail.com" },
  { name: "Nia Okafor", email: "nia.okafor@gmail.com" },
  { name: "Rob Chen", email: "rob.chen@gmail.com", inactive: true },
  { name: "Ana Ruiz", email: "ana.ruiz@outlook.com", invited: true },
  { name: "Ana Kovač", email: "ana.kovac@gmail.com" },
  { name: "Luis Herrera" },
  { name: "Sam Whitaker" },
  { name: "Cole Bennett" },
  { name: "Marcus Reed" },
  { name: "Keisha Grant" },
  { name: "Tom Byrne" },
  { name: "Dana Ortiz" },
  { name: "Theo Park" },
  { name: "Lena Ruiz" },
  { name: "Chris Vale" },
  { name: "Nadia Brooks" },
  { name: "Felix Ward", pushOff: true },
  { name: "June Ito" },
  { name: "Eli Navarro" },
  { name: "Mina Cho" },
  { name: "Ray Duncan" },
  { name: "Bea Lin" },
  { name: "Omar Haddad" },
  { name: "Gus Patel" },
  { name: "Ivy Moreno" },
  { name: "Noel Fry" },
  { name: "Tara Singh" },
  { name: "Wes Ahn" },
  { name: "Nora Quinn" },
  { name: "Dev Malik" },
  { name: "Rosa Lim" },
  { name: "Ben Ochoa" },
]

const ascii = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")

export const ROSTER = PEOPLE.map((person, index) => ({
  ...person,
  id: stableId(100 + index),
  email: person.email ?? `${ascii(person.name)}@example.com`,
  phone: person.phone ?? `(415) 555-01${String(index).padStart(2, "0")}`,
  device: person.device ?? (index % 3 === 0 ? "iPhone" : "Android"),
}))

const byName = new Map(ROSTER.map((person) => [person.name, person]))

export function person(name: string) {
  const found = byName.get(name)
  if (!found) throw new Error(`Unknown demo person: ${name}`)
  return found
}

export type VenueKey = "grand" | "harbor" | "maison" | "osteria" | "laurel" | "westfield"

export type VenueSpec = {
  name: string
  address: string
  lat: number
  lng: number
  radius: number
  contact: string
  contactName: string
  contactTel: string
  dress: string
  rateCents: number
  billing: string
}

export const VENUES: Record<VenueKey, VenueSpec> = {
  grand: {
    name: "The Grand Hotel",
    address: "400 Market St, San Francisco",
    lat: 37.7937,
    lng: -122.3965,
    radius: 150,
    contact: "Priya · front desk",
    contactName: "Priya",
    contactTel: "+14155550142",
    dress: "Black suit",
    rateCents: 3800,
    billing: "ap@thegrandhotel.com",
  },
  harbor: {
    name: "Harbor Pavilion",
    address: "Pier 3, The Embarcadero",
    lat: 37.7955,
    lng: -122.3935,
    radius: 250,
    contact: "Marco · events lead",
    contactName: "Marco",
    contactTel: "+14155550199",
    dress: "Black suit, white shirt",
    rateCents: 3800,
    billing: "billing@harborpavilion.com",
  },
  maison: {
    name: "Maison Blanc",
    address: "88 Fillmore St",
    lat: 37.7727,
    lng: -122.4305,
    radius: 150,
    contact: "Camille · front of house",
    contactName: "Camille",
    contactTel: "+14155550163",
    dress: "Black suit",
    rateCents: 3800,
    billing: "accounts@maisonblanc.com",
  },
  osteria: {
    name: "Osteria Nove",
    address: "1201 Valencia St",
    lat: 37.7527,
    lng: -122.4206,
    radius: 100,
    contact: "Elena · host stand",
    contactName: "Elena",
    contactTel: "+14155550177",
    dress: "Black shirt and slacks",
    rateCents: 3500,
    billing: "owner@osterianove.com",
  },
  laurel: {
    name: "The Laurel Club",
    address: "2 Laurel Ave",
    lat: 37.7869,
    lng: -122.4018,
    radius: 150,
    contact: "Dani · door",
    contactName: "Dani",
    contactTel: "+14155550155",
    dress: "Black suit",
    rateCents: 3800,
    billing: "manager@laurelclub.com",
  },
  westfield: {
    name: "Westfield Gala",
    address: "Westfield Centre, L4",
    lat: 37.7842,
    lng: -122.4066,
    radius: 400,
    contact: "Ines · events desk",
    contactName: "Ines",
    contactTel: "+14155550188",
    dress: "Black suit",
    rateCents: 3800,
    billing: "events@westfieldcentre.com",
  },
}

export const VENUE_KEYS = Object.keys(VENUES) as VenueKey[]
