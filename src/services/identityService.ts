import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const reconcileIdentity = async (email?: string, phoneNumber?: string) => {
  // 1. Find all contacts that match either the email or the phone number
  const matchingContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email || undefined },
        { phoneNumber: phoneNumber || undefined },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  // 2. If no contacts exist, create a new primary contact
  if (matchingContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      },
    });

    return {
      primaryContatctId: newContact.id,
      emails: newContact.email ? [newContact.email] : [],
      phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
      secondaryContactIds: [],
    };
  }

  // 3. Find all related contacts (the whole cluster)
  const relatedIds = new Set<number>();
  matchingContacts.forEach(c => {
    relatedIds.add(c.id);
    if (c.linkedId) relatedIds.add(c.linkedId);
  });

  const allRelatedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: Array.from(relatedIds) } },
        { linkedId: { in: Array.from(relatedIds) } }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });

  // 4. Identify the absolute oldest contact to act as the primary
  const primaryContact = allRelatedContacts[0]; 

  // 5. Check if we need to create a new secondary contact (new info provided)
  const existingEmails = allRelatedContacts.map(c => c.email).filter(Boolean);
  const existingPhones = allRelatedContacts.map(c => c.phoneNumber).filter(Boolean);
  
  const isNewEmail = email && !existingEmails.includes(email);
  const isNewPhone = phoneNumber && !existingPhones.includes(phoneNumber);

  if (isNewEmail || isNewPhone) {
    const newSecondary = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: primaryContact.id,
        linkPrecedence: "secondary",
      }
    });
    allRelatedContacts.push(newSecondary);
  }

  // 6. Check if any existing primary contacts need to be demoted to secondary
  for (const contact of allRelatedContacts) {
    if (contact.id !== primaryContact.id && contact.linkPrecedence === "primary") {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          linkedId: primaryContact.id,
          linkPrecedence: "secondary"
        }
      });
      contact.linkPrecedence = "secondary";
      contact.linkedId = primaryContact.id;
    }
  }

  // 7. Format the response
  const emails = Array.from(new Set(allRelatedContacts.map(c => c.email).filter(Boolean)));
  const phoneNumbers = Array.from(new Set(allRelatedContacts.map(c => c.phoneNumber).filter(Boolean)));
  const secondaryContactIds = allRelatedContacts
    .filter(c => c.id !== primaryContact.id)
    .map(c => c.id);

  // Ensure primary contact's email and phone are first in the arrays [cite: 25]
  if (primaryContact.email && emails[0] !== primaryContact.email) {
    emails.splice(emails.indexOf(primaryContact.email), 1);
    emails.unshift(primaryContact.email);
  }
  if (primaryContact.phoneNumber && phoneNumbers[0] !== primaryContact.phoneNumber) {
    phoneNumbers.splice(phoneNumbers.indexOf(primaryContact.phoneNumber), 1);
    phoneNumbers.unshift(primaryContact.phoneNumber);
  }

  return {
    primaryContatctId: primaryContact.id,
    emails,
    phoneNumbers,
    secondaryContactIds,
  };
};