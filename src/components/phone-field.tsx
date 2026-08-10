import { useMemo, useState } from 'react'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import {
  defaultPhoneCountry,
  listPhoneCountries,
  parseStoredPhone,
  sanitizeNationalNumber,
} from '#/lib/auth/phone'
import type { CountryCode } from '#/lib/auth/phone'
import { getCountryCallingCode } from 'libphonenumber-js'

export function PhoneField({
  valueE164,
  onChange,
}: {
  valueE164: string | null
  onChange: (next: { country: CountryCode; nationalNumber: string }) => void
}) {
  const countries = useMemo(() => listPhoneCountries(), [])
  const initial = parseStoredPhone(valueE164)
  const [country, setCountry] = useState<CountryCode>(initial.country)
  const [nationalNumber, setNationalNumber] = useState(initial.nationalNumber)

  const callingCode =
    countries.find((item) => item.code === country)?.callingCode ?? ''

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
      <Field>
        <Field.Label>Country</Field.Label>
        <Field.Control>
          <Select
            value={country}
            onChange={(event) => {
              const next = event.target.value as CountryCode
              setCountry(next)
              onChange({ country: next, nationalNumber })
            }}
          >
            {countries.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field.Control>
      </Field>
      <Field>
        <Field.Label>Phone number</Field.Label>
        <Field.Control>
          <div className="flex gap-2">
            <span className="border-border bg-background text-foreground-secondary inline-flex items-center rounded-xl border px-3 text-sm">
              +{callingCode || getCountryCallingCode(defaultPhoneCountry())}
            </span>
            <Input
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="Phone number"
              value={nationalNumber}
              onChange={(event) => {
                const next = sanitizeNationalNumber(event.target.value)
                setNationalNumber(next)
                onChange({ country, nationalNumber: next })
              }}
            />
          </div>
        </Field.Control>
        <Field.Description>
          Optional. Digits only — country code comes from the dropdown.
        </Field.Description>
      </Field>
    </div>
  )
}
