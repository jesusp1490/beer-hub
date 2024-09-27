import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTabsModule
  ]
})
export class ContactComponent {
  contactForm: FormGroup;

  faqs = [
    {
      question: "How can I join the BeerHub community?",
      answer: "You can sign up for an account on our website to start rating beers and interacting with other beer enthusiasts."
    },
    {
      question: "Is BeerHub available as a mobile app?",
      answer: "Currently, BeerHub is a web-based platform. We're working on mobile apps for iOS and Android, which we plan to release in the near future."
    },
    {
      question: "How can I add a beer that's not listed on BeerHub?",
      answer: "You can submit new beer entries through our 'Request a new beer' form. Our team will review the submission and add it to our database if it meets our criteria. We are working on a feature to allow the users to upload the beers themselves in the future. "
    },
    {
      question: "Can I change my username or email address?",
      answer: "Yes, you can update your profile information, including your username and email address, in your account settings."
    },
    {
      question: "How does the beer rating system work?",
      answer: "Users can rate beers on a scale of 1 to 5 stars. The overall rating for each beer is an average of all user ratings."
    }
  ];

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      console.log('Form submitted:', this.contactForm.value);
      // Here you would typically send the form data to your backend
    }
  }
}