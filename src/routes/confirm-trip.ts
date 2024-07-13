import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import nodemailer from 'nodemailer'

import { prisma } from '../lib/prisma'
import { getMailClient } from '../lib/mail'

import { dayjs } from './dayjs'

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/confirm',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            where: {
              is_owner: false,
            },
          },
        },
      })

      if (!trip) {
        throw new Error('Trip not found!')
      }

      if (trip.is_confirmed) {
        return reply.redirect(`http://localhost:3000/trips/${tripId}`)
      }

      await prisma.trip.update({
        where: { id: tripId },
        data: { is_confirmed: true },
      })

      const formattedStartDate = dayjs(trip.starts_at).format('LL')

      const formattedEndDate = dayjs(trip.starts_at).format('LL')

      const mail = await getMailClient()

      await Promise.all(
        trip.participants.map(async (participant) => {
          const confirmationLink = `http://localhost:3333/participants/${participant.id}/confirm`

          const message = await mail.sendMail({
            from: {
              name: 'Team plann.er',
              address: 'hello@plann.er',
            },
            to: participant.email,
            subject: `Confirm your presence on the trip to ${trip.destination} at ${formattedStartDate}`,
            html: `
          <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
            <p>
              You have been invited to participate in a trip to <strong>${trip.destination}</strong> for the dates of <strong>${formattedStartDate}</strong> to <strong>${formattedEndDate}</strong>.
            </p>
            <p></p>
            <p>To confirm your presence on the trip, click on the link below:</p>
            <p></p>
            <p>
              <a href=${confirmationLink}>Confirm trip</a>
            </p>
            <p></p>
            <p>If you don't know what this email is about, just ignore this email.</p>
          </div>
        `.trim(),
          })

          console.log(nodemailer.getTestMessageUrl(message))
        })
      )

      return reply.redirect(`http://localhost:3000/trips/${tripId}`)
    }
  )
}
