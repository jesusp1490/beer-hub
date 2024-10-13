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
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularFireFunctions } from '@angular/fire/compat/functions';

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
      answer: "You can submit new beer entries through our 'Request a new beer' form. Our team will review the submission and add it to our database if it meets our criteria. We are working on a feature to allow the users to upload the beers themselves in the future."
    },
    {
      question: "Can I change my username or email address?",
      answer: "Yes, you can update your profile information, including your username and email address, in your account settings."
    },
    {
      question: "How does the beer rating system work?",
      answer: "Users can rate beers on a scale of 1 to 5 stars. The overall rating for each beer is an average of all user ratings."
    },
    {
      question: "How does the map work?",
      answer: "Our interactive map feature displays beer data from around the world. Each country is color-coded based on the number of beers in our database from that country. Darker shades indicate a higher number of beers. You can click on a country to view more detailed information about its beers, including popular brands, styles, and average ratings. This feature allows you to explore beer cultures globally and discover new brews from different regions."
    },
    {
      question: "How can I discover new beers on BeerHub?",
      answer: "BeerHub offers several ways to discover new beers. You can use our advanced search and filter options to find beers based on style, country, ABV, or user ratings. Our homepage features sections like 'Best Rated' and 'Popular Brands' to help you explore trending and highly-rated beers. Additionally, our interactive map allows you to explore beers from different countries, helping you discover unique brews from around the world. Don't forget to check your personalized recommendations based on your rating history!"
    }
  ];

  constructor(
    private fb: FormBuilder,
    private fns: AngularFireFunctions,
    private snackBar: MatSnackBar
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      const sendEmail = this.fns.httpsCallable('sendEmail');
      
      sendEmail(formData).subscribe(
        (result: any) => {
          console.log('Email sent successfully', result);
          this.contactForm.reset();
          this.snackBar.open('Your message has been sent successfully!', 'Close', {
            duration: 3000,
          });
        },
        (error) => {
          console.error('Error sending email', error);
          this.snackBar.open('There was an error sending your message. Please try again later.', 'Close', {
            duration: 3000,
          });
        }
      );
    }
  }
}